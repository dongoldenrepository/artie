#!/usr/bin/env node
/**
 * Artie – Trial → Paid Upgrade Script
 *
 * Removes trial restrictions from a Pages project (TRIAL_MODE, TRIAL_EXPIRES,
 * TRIAL_LIMIT env vars) and updates the registry to "paid".
 *
 * Usage:
 *   node scripts/upgrade.mjs <slug>
 *
 * Example:
 *   node scripts/upgrade.mjs jane-smith
 *
 * Requires env vars: CF_ACCOUNT_ID, CF_API_TOKEN
 */

import { fileURLToPath } from 'url'
import { findBySlug, upsert } from './registry.mjs'

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_API_TOKEN  = process.env.CF_API_TOKEN

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

// ── Args ──────────────────────────────────────────────────────────────────────
const slug = process.argv[2]?.trim()
if (!slug)              die('Usage: node scripts/upgrade.mjs <slug>')
if (!CF_ACCOUNT_ID || !CF_API_TOKEN) die('Missing env vars — run: export CF_ACCOUNT_ID=xxx CF_API_TOKEN=xxx')

const entry = findBySlug(slug)
if (!entry)             die(`"${slug}" not found in registry. Check scripts/artists.json.`)
if (entry.status === 'paid') {
  console.log(`\n  ✓  ${entry.name} (${slug}) is already on a paid account.\n`)
  process.exit(0)
}
if (entry.status === 'decommissioned') die(`"${slug}" has been decommissioned.`)

const projectName = entry.project_name ?? `artie-${slug}`

// ── Banner ────────────────────────────────────────────────────────────────────
console.log(`
╔═══════════════════════════════════════════════════╗
   Artie Upgrade: Trial → Paid
   Artist  : ${entry.name}
   Project : ${projectName}
╚═══════════════════════════════════════════════════╝`)

// ── Step 1: Fetch current Pages project config ────────────────────────────────
step(1, 'Fetching current Pages project config...')
const project = await cfApi('GET', `/accounts/${CF_ACCOUNT_ID}/pages/projects/${projectName}`)
const currentEnv = project.deployment_configs?.production?.env_vars ?? {}
log(`✓ Retrieved`)

// ── Step 2: Remove trial env vars ─────────────────────────────────────────────
step(2, 'Removing trial restrictions...')

// Cloudflare removes an env var when you set it to null
const updatedEnv = { ...currentEnv }
for (const key of ['TRIAL_MODE', 'TRIAL_EXPIRES', 'TRIAL_LIMIT']) {
  if (updatedEnv[key] !== undefined) {
    updatedEnv[key] = null
    log(`  Removing ${key}`)
  }
}

const deployConfig = {
  ...project.deployment_configs?.production,
  env_vars: updatedEnv,
}

try {
  await cfApi('PATCH', `/accounts/${CF_ACCOUNT_ID}/pages/projects/${projectName}`, {
    deployment_configs: {
      production: deployConfig,
      preview:    deployConfig,
    },
  })
  log(`✓ Trial restrictions removed`)
} catch (e) {
  log(`⚠  CF API error: ${e.message}`)
  log(`   → Manually remove TRIAL_MODE, TRIAL_EXPIRES, TRIAL_LIMIT from`)
  log(`     Cloudflare Pages → ${projectName} → Settings → Variables & Secrets`)
}

// ── Step 3: Trigger a new deployment (so the Worker picks up env changes) ─────
step(3, 'Triggering redeployment...')
try {
  await cfApi('POST', `/accounts/${CF_ACCOUNT_ID}/pages/projects/${projectName}/deployments`)
  log(`✓ Deployment triggered — live in ~1 minute`)
} catch (e) {
  log(`⚠  Could not trigger deploy: ${e.message}`)
  log(`   → Push any small commit to GitHub to trigger a rebuild, or`)
  log(`     deploy manually from the Cloudflare dashboard`)
}

// ── Step 4: Update registry ───────────────────────────────────────────────────
step(4, 'Updating registry...')
upsert({
  slug,
  status:        'paid',
  trial_expires: null,
  trial_limit:   null,
  upgraded_at:   new Date().toISOString(),
})
log(`✓ scripts/artists.json updated`)

// ── Done ──────────────────────────────────────────────────────────────────────
console.log(`
  ✓  ${entry.name} is now on a full paid account.
     Site: https://${projectName}.pages.dev
     The trial banner and piece limit will be gone after the redeploy.
`)
