#!/usr/bin/env node
/**
 * Artie – Artist Provisioning Script
 *
 * Usage:
 *   node scripts/provision.mjs "Jane Smith"
 *   node scripts/provision.mjs "Jane Smith" --trial
 *   node scripts/provision.mjs "Jane Smith" --trial --days=14
 *   node scripts/provision.mjs "Jane Smith" --trial --password=Welcome123
 *   node scripts/provision.mjs "Jane Smith" --slug=jane-smith-denver   (collision override)
 *   node scripts/provision.mjs "Jane Smith" --email=jane@example.com
 *
 * Requires env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN
 * (Copy scripts/.env.example → scripts/.env and source it, or set them in your shell)
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { resolveSlug, upsert } from './registry.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const ROOT       = path.resolve(__dirname, '..')

// ── Config ───────────────────────────────────────────────────────────────────
const CF_ACCOUNT_ID        = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN         = process.env.CLOUDFLARE_API_TOKEN
const MASTER_VIEWER_PIN    = process.env.MASTER_VIEWER_PASSWORD  // your bypass PIN for all sites
const GITHUB_OWNER         = 'dongoldenrepository'
const GITHUB_REPO          = 'artie'
const R2_BUCKET            = 'artie-site-images'
const TRIAL_LIMIT          = 10
const DEFAULT_VIEWER_PIN   = '1123'

// ── Args ─────────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2)
const artistName = args.find(a => !a.startsWith('--'))?.trim()
const isTrial    = args.includes('--trial')
const daysArg    = args.find(a => a.startsWith('--days='))
const trialDays  = daysArg ? parseInt(daysArg.split('=')[1]) : 14
const pwArg      = args.find(a => a.startsWith('--password='))
const password   = pwArg ? pwArg.split('=')[1] : randomPassword()
const slugArg    = args.find(a => a.startsWith('--slug='))
const emailArg   = args.find(a => a.startsWith('--email='))
const email      = emailArg ? emailArg.split('=')[1] : null

// ── Validate ─────────────────────────────────────────────────────────────────
if (!artistName) die(
  'Usage: node scripts/provision.mjs "Jane Smith" [--trial] [--days=14] [--password=xxx] [--slug=jane-smith-denver] [--email=jane@example.com]'
)
if (!CF_ACCOUNT_ID || !CF_API_TOKEN) die(
  'Missing env vars — run: export CLOUDFLARE_ACCOUNT_ID=xxx CLOUDFLARE_API_TOKEN=xxx\n' +
  '(See scripts/.env.example)'
)

// ── Derived names (with collision detection) ───────────────────────────────────
const baseSlug    = slugArg ? slugArg.split('=')[1] : toSlug(artistName)
const slug        = resolveSlug(baseSlug)

if (slug !== baseSlug) {
  console.log(`\n  ⚠  Slug "${baseSlug}" already in use — using "${slug}" instead.`)
  console.log(`     (Override with --slug=your-choice if you prefer a different suffix)\n`)
}

const projectName = `artie-${slug}`
const dbName      = `artie-${slug}-db`
const configFile  = path.join(ROOT, `wrangler-${slug}.toml`)
const trialExpires = isTrial
  ? new Date(Date.now() + trialDays * 86_400_000).toISOString().split('T')[0]
  : null

// ── Helpers ───────────────────────────────────────────────────────────────────
function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function randomPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function die(msg) { console.error('\n❌  ' + msg + '\n'); process.exit(1) }
function log(msg)  { console.log('     ' + msg) }
function step(n, msg) { console.log(`\n  ${n}. ${msg}`) }

async function cfApi(method, urlPath, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.success) throw new Error(JSON.stringify(json.errors ?? json.messages ?? json))
  return json.result
}

function run(cmd, label) {
  if (label) log(`→ ${label}`)
  execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
}

// ── Banner ────────────────────────────────────────────────────────────────────
console.log(`
╔═══════════════════════════════════════════════════╗
   Artie Provisioning
   Artist  : ${artistName}
   Project : ${projectName}
   Trial   : ${isTrial ? `Yes — ${trialDays} days, ${TRIAL_LIMIT} piece limit (expires ${trialExpires})` : 'No (full account)'}
╚═══════════════════════════════════════════════════╝`)

// ── Step 1: Create D1 database ────────────────────────────────────────────────
step(1, 'Creating D1 database...')
const db   = await cfApi('POST', `/accounts/${CF_ACCOUNT_ID}/d1/database`, { name: dbName })
const dbId = db.uuid
log(`✓ ${dbName}`)
log(`  ID: ${dbId}`)

// ── Step 2: Write wrangler config ─────────────────────────────────────────────
step(2, 'Writing wrangler config...')
const trialBlock = isTrial
  ? `TRIAL_MODE    = "true"\nTRIAL_EXPIRES = "${trialExpires}"\nTRIAL_LIMIT   = "${TRIAL_LIMIT}"`
  : ''

const toml = `# Artie – ${artistName}
# Generated by provision.mjs on ${new Date().toISOString().split('T')[0]}

name = "${projectName}"
compatibility_date = "2024-09-23"
pages_build_output_dir = "dist"

[vars]
ARTIST_NAME    = "${artistName}"
ADMIN_PASSWORD = "${password}"
${trialBlock}

[[d1_databases]]
binding       = "DB"
database_name = "${dbName}"
database_id   = "${dbId}"

[[r2_buckets]]
binding     = "IMAGES"
bucket_name = "${R2_BUCKET}"
`
fs.writeFileSync(configFile, toml)
log(`✓ ${path.basename(configFile)}`)

// ── Step 3: Run schema migrations ─────────────────────────────────────────────
step(3, 'Running migrations...')
const migrationsDir = path.join(ROOT, 'migrations')
const migrations = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql') && fs.statSync(path.join(migrationsDir, f)).isFile())
  .sort()

for (const file of migrations) {
  const filePath = path.join(migrationsDir, file)
  try {
    run(
      `npx wrangler d1 execute ${dbName} --remote --file="${filePath}" --config="${configFile}" --yes`,
      file
    )
    log(`  ✓ ${file}`)
  } catch (e) {
    log(`  ⚠ ${file} — ${e.message.slice(0, 80)} (continuing)`)
  }
}

// ── Step 4: Set artist name ───────────────────────────────────────────────────
step(4, 'Setting artist name...')
const safeName = artistName.replace(/'/g, "''")
run(
  `npx wrangler d1 execute ${dbName} --remote ` +
  `--command="UPDATE artists SET name='${safeName}' WHERE id=1;" ` +
  `--config="${configFile}"`,
  `UPDATE artists name → ${artistName}`
)
log(`✓ Name set`)

// ── Step 5: Seed tags ─────────────────────────────────────────────────────────
step(5, 'Seeding medium / subject / style tags...')
const seedFile = path.join(__dirname, 'seed-tags.sql')
run(
  `npx wrangler d1 execute ${dbName} --remote --file="${seedFile}" --config="${configFile}" --yes`,
  'seed-tags.sql'
)
log(`✓ Tags seeded`)

// ── Step 6: Create Pages project ──────────────────────────────────────────────
step(6, 'Creating Cloudflare Pages project...')
const envVars = {
  ARTIST_NAME:            { value: artistName,         type: 'plain_text'  },
  ADMIN_PASSWORD:         { value: password,           type: 'secret_text' },
  VIEWER_PASSWORD:        { value: DEFAULT_VIEWER_PIN, type: 'secret_text' },
  ...(MASTER_VIEWER_PIN ? {
    MASTER_VIEWER_PASSWORD: { value: MASTER_VIEWER_PIN, type: 'secret_text' },
  } : {}),
  ...(isTrial ? {
    TRIAL_MODE:    { value: 'true',             type: 'plain_text' },
    TRIAL_EXPIRES: { value: trialExpires,        type: 'plain_text' },
    TRIAL_LIMIT:   { value: String(TRIAL_LIMIT), type: 'plain_text' },
  } : {}),
}
const deployConfig = {
  env_vars:     envVars,
  d1_databases: { DB:     { id:   dbId      } },
  r2_buckets:   { IMAGES: { name: R2_BUCKET } },
}

try {
  await cfApi('POST', `/accounts/${CF_ACCOUNT_ID}/pages/projects`, {
    name: projectName,
    production_branch: 'main',
    source: {
      type: 'github',
      config: {
        owner:                GITHUB_OWNER,
        repo_name:            GITHUB_REPO,
        production_branch:    'main',
        pr_comments_enabled:  false,
        deployments_enabled:  true,
      },
    },
    build_config: {
      build_command:   'npm run build',
      destination_dir: 'dist',
    },
    deployment_configs: {
      production: deployConfig,
      preview:    deployConfig,
    },
  })
  log(`✓ Pages project created — deploying now`)
} catch (e) {
  log(`⚠  Pages API error: ${e.message}`)
  log(`   → Manual step: create Pages project "${projectName}" in Cloudflare dashboard`)
  log(`     Connect: ${GITHUB_OWNER}/${GITHUB_REPO}, branch: main`)
  log(`     Build: npm run build  |  Output: dist`)
  log(`     Add env vars and D1/R2 bindings from wrangler-${slug}.toml`)
}

// ── Write to registry ─────────────────────────────────────────────────────────
upsert({
  name:          artistName,
  slug,
  email:         email ?? null,
  db_id:         dbId,
  project_name:  projectName,
  status:        isTrial ? 'trial' : 'paid',
  trial_expires: trialExpires ?? null,
  trial_limit:   isTrial ? TRIAL_LIMIT : null,
  password_hint: password.slice(0, 3) + '…', // don't store full password
  site_url:      `https://${projectName}.pages.dev`,
})

// ── Done ──────────────────────────────────────────────────────────────────────
console.log(`
╔═══════════════════════════════════════════════════╗
   ✓  Provisioning complete!

   Email to ${artistName}:
   ─────────────────────────────────────────────
   Site URL    : https://${projectName}.pages.dev
   Admin PIN   : ${password}
   Viewer PIN  : ${DEFAULT_VIEWER_PIN}
${isTrial ? `   Trial      : ${TRIAL_LIMIT} pieces · expires ${trialExpires}` : ''}

   ⚠  Save for decommission:
   Slug     : ${slug}
   DB ID    : ${dbId}
╚═══════════════════════════════════════════════════╝
`)
