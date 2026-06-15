#!/usr/bin/env node
/**
 * Artie – Set Viewer PIN on all live Pages projects
 *
 * Sets VIEWER_PASSWORD and (optionally) MASTER_VIEWER_PASSWORD on every
 * active site in the registry.
 *
 * Usage:
 *   node scripts/set-viewer-pin.mjs                         # set VIEWER_PASSWORD=1123 on all sites
 *   node scripts/set-viewer-pin.mjs --pin=4567              # use a different viewer PIN
 *   node scripts/set-viewer-pin.mjs --master=mysecretpin    # also set master bypass PIN
 *   node scripts/set-viewer-pin.mjs --slug=kathy-golden     # one site only
 *
 * Requires env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN
 */

import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN  = process.env.CLOUDFLARE_API_TOKEN

if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error('\n❌  Missing env vars — run: source scripts/.env\n')
  process.exit(1)
}

// ── Args ──────────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2)
const pinArg     = args.find(a => a.startsWith('--pin='))
const masterArg  = args.find(a => a.startsWith('--master='))
const slugArg    = args.find(a => a.startsWith('--slug='))

const viewerPin  = pinArg    ? pinArg.split('=')[1]    : '1123'
const masterPin  = masterArg ? masterArg.split('=')[1] : null
const onlySlug   = slugArg   ? slugArg.split('=')[1]   : null

// ── Registry ──────────────────────────────────────────────────────────────────
const registry = JSON.parse(readFileSync(path.join(__dirname, 'artists.json'), 'utf8'))
const targets  = registry.filter(a =>
  a.status !== 'decommissioned' &&
  (!onlySlug || a.slug === onlySlug)
)

if (targets.length === 0) {
  console.error(`\n❌  No active artists found${onlySlug ? ` matching slug "${onlySlug}"` : ''}.\n`)
  process.exit(1)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Banner ────────────────────────────────────────────────────────────────────
console.log(`
╔═══════════════════════════════════════════════════╗
   Artie – Set Viewer PIN
   Viewer PIN : ${viewerPin}
   Master PIN : ${masterPin ?? '(not set)'}
   Sites      : ${targets.map(a => a.slug).join(', ')}
╚═══════════════════════════════════════════════════╝`)

// ── Update each site ──────────────────────────────────────────────────────────
let i = 1
for (const artist of targets) {
  const projectName = artist.project_name ?? `artie-${artist.slug}`
  step(i++, `${artist.name} (${projectName})...`)

  try {
    const project    = await cfApi('GET', `/accounts/${CF_ACCOUNT_ID}/pages/projects/${projectName}`)
    const currentEnv = project.deployment_configs?.production?.env_vars ?? {}

    const updatedEnv = {
      ...currentEnv,
      VIEWER_PASSWORD: { value: viewerPin, type: 'secret_text' },
      ...(masterPin ? { MASTER_VIEWER_PASSWORD: { value: masterPin, type: 'secret_text' } } : {}),
    }

    const deployConfig = {
      ...project.deployment_configs?.production,
      env_vars: updatedEnv,
    }

    await cfApi('PATCH', `/accounts/${CF_ACCOUNT_ID}/pages/projects/${projectName}`, {
      deployment_configs: {
        production: deployConfig,
        preview:    deployConfig,
      },
    })
    log(`✓ Updated`)

    // Trigger redeploy so workers pick up the new vars
    await cfApi('POST', `/accounts/${CF_ACCOUNT_ID}/pages/projects/${projectName}/deployments`)
    log(`✓ Redeployment triggered`)
  } catch (e) {
    log(`⚠  ${e.message}`)
    log(`   → Manually add VIEWER_PASSWORD="${viewerPin}" in Cloudflare dashboard → ${projectName} → Settings → Variables`)
  }
}

console.log(`
  ✓  Done. Sites will be gated by PIN after redeployment (~1 min each).
     Share the viewer PIN with guests: ${viewerPin}
${masterPin ? `     Your master bypass PIN: ${masterPin}` : '     Tip: run with --master=yourpin to set a bypass PIN across all sites.'}
`)
