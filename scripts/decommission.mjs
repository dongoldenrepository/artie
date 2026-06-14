#!/usr/bin/env node
/**
 * Artie – Artist Decommission Script
 *
 * Deletes everything for an artist: R2 images, Pages project, D1 database.
 * Run the artist's DB query FIRST (before deleting the DB) to find their images.
 *
 * Usage:
 *   node scripts/decommission.mjs <slug> <db-id>
 *
 * Example:
 *   node scripts/decommission.mjs jane-smith 29a538c3-feff-4b09-9ed2-00d59495ff68
 *
 * Requires env vars: CF_ACCOUNT_ID, CF_API_TOKEN
 */

import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_API_TOKEN  = process.env.CF_API_TOKEN
const R2_BUCKET     = 'artie-site-images'

const [slug, dbId] = process.argv.slice(2)

// ── Validate ──────────────────────────────────────────────────────────────────
if (!slug || !dbId) die(
  'Usage: node scripts/decommission.mjs <slug> <db-id>\n' +
  'Example: node scripts/decommission.mjs jane-smith 29a538c3-feff-4b09-9ed2-00d59495ff68'
)
if (!CF_ACCOUNT_ID || !CF_API_TOKEN) die(
  'Missing env vars — run: export CF_ACCOUNT_ID=xxx CF_API_TOKEN=xxx'
)

const projectName = `artie-${slug}`
const dbName      = `artie-${slug}-db`

// ── Helpers ───────────────────────────────────────────────────────────────────
function die(msg)  { console.error('\n❌  ' + msg + '\n'); process.exit(1) }
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

// ── Confirm ───────────────────────────────────────────────────────────────────
console.log(`
╔═══════════════════════════════════════════════════╗
   ⚠  Artie Decommission

   Slug    : ${slug}
   Project : ${projectName}
   DB      : ${dbName} (${dbId})

   This permanently deletes:
   • All R2 images for this artist
   • The Pages project
   • The D1 database

   Press Ctrl-C to abort...
╚═══════════════════════════════════════════════════╝`)

// 5-second grace period
for (let i = 5; i > 0; i--) {
  process.stdout.write(`\r  Continuing in ${i}s... (Ctrl-C to abort)  `)
  await new Promise(r => setTimeout(r, 1000))
}
console.log('\n')

// ── Step 1: Fetch image keys from D1 ─────────────────────────────────────────
step(1, 'Fetching image keys from D1 (before DB deletion)...')
let imageKeys = []
try {
  const result = await cfApi('POST', `/accounts/${CF_ACCOUNT_ID}/d1/database/${dbId}/query`, {
    sql: `SELECT image_key FROM artworks      WHERE image_key IS NOT NULL
          UNION
          SELECT image_key FROM artwork_images WHERE image_key IS NOT NULL`,
  })
  imageKeys = (result[0]?.results ?? []).map(r => r.image_key).filter(Boolean)
  log(`Found ${imageKeys.length} image(s)`)
} catch (e) {
  log(`⚠  Could not query D1: ${e.message}`)
  log(`   R2 images will NOT be cleaned up automatically`)
}

// ── Step 2: Delete R2 images ──────────────────────────────────────────────────
if (imageKeys.length > 0) {
  step(2, `Deleting ${imageKeys.length} R2 image(s) from ${R2_BUCKET}...`)
  // Use wrangler CLI — simpler than S3-compatible API for object deletion
  const configFile = path.join(ROOT, `wrangler-${slug}.toml`)
  const hasConfig  = (() => { try { return require('fs').existsSync(configFile) } catch { return false } })()
  const configArg  = hasConfig ? `--config="${configFile}"` : `--config="${path.join(ROOT, 'wrangler-don.toml')}"`

  let deleted = 0
  for (const key of imageKeys) {
    try {
      execSync(
        `npx wrangler r2 object delete "${R2_BUCKET}/${key}" ${configArg}`,
        { cwd: ROOT, stdio: 'pipe' }
      )
      deleted++
    } catch {
      log(`  ⚠ Could not delete: ${key}`)
    }
  }
  log(`✓ Deleted ${deleted} of ${imageKeys.length} image(s)`)
} else {
  step(2, 'No R2 images to delete')
}

// ── Step 3: Delete Pages project ─────────────────────────────────────────────
step(3, `Deleting Pages project: ${projectName}...`)
try {
  await cfApi('DELETE', `/accounts/${CF_ACCOUNT_ID}/pages/projects/${projectName}`)
  log(`✓ Deleted`)
} catch (e) {
  log(`⚠  ${e.message}`)
  log(`   Manually delete "${projectName}" in Cloudflare dashboard → Workers & Pages`)
}

// ── Step 4: Delete D1 database ────────────────────────────────────────────────
step(4, `Deleting D1 database: ${dbName}...`)
try {
  await cfApi('DELETE', `/accounts/${CF_ACCOUNT_ID}/d1/database/${dbId}`)
  log(`✓ Deleted`)
} catch (e) {
  log(`⚠  ${e.message}`)
  log(`   Manually delete "${dbName}" in Cloudflare dashboard → Storage & Databases → D1`)
}

// ── Step 5: Clean up local wrangler config ────────────────────────────────────
step(5, 'Cleaning up local config...')
const configPath = path.join(ROOT, `wrangler-${slug}.toml`)
try {
  if (require('fs').existsSync(configPath)) {
    require('fs').unlinkSync(configPath)
    log(`✓ Removed ${path.basename(configPath)}`)
  } else {
    log(`  (wrangler-${slug}.toml not found — already removed or was never created)`)
  }
} catch (e) {
  log(`⚠  Could not remove config: ${e.message}`)
}

console.log(`
  ✓  Decommissioning complete for artie-${slug}
`)
