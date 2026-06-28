#!/usr/bin/env node
/**
 * Artie – Connection Health Check
 *
 * Queries Cloudflare for every artie-* Pages project and reports
 * whether each one is connected to the correct GitHub repo.
 *
 * Usage:
 *   node scripts/check-connections.mjs
 *
 * Requires env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN
 */

const CF_ACCOUNT_ID    = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN     = process.env.CLOUDFLARE_API_TOKEN
const EXPECTED_OWNER   = 'dongoldenrepository'
const EXPECTED_REPO    = 'artie'
const EXPECTED_BRANCH  = 'main'
const EXCLUDE          = new Set(['artie-coming-soon'])

if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error('\n❌  Missing env vars — source scripts/.env first\n')
  process.exit(1)
}

async function cfApi(urlPath) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${urlPath}`, {
    headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
  })
  const json = await res.json()
  if (!json.success) throw new Error(JSON.stringify(json.errors ?? json))
  return json.result
}

// Fetch all Pages projects
async function fetchAllProjects() {
  return await cfApi(`/accounts/${CF_ACCOUNT_ID}/pages/projects`)
}

console.log('\n  Checking Artie site connections...\n')

const all      = await fetchAllProjects()
const projects = all.filter(p => p.name.startsWith('artie-') && !EXCLUDE.has(p.name)).sort((a, b) => a.name.localeCompare(b.name))

if (projects.length === 0) {
  console.log('  No artie-* projects found.\n')
  process.exit(0)
}

const OK   = []
const FAIL = []

for (const p of projects) {
  const src    = p.source?.config ?? {}
  const owner  = src.owner    ?? '(none)'
  const repo   = src.repo_name ?? '(none)'
  const branch = src.production_branch ?? '(none)'
  const ok     = owner === EXPECTED_OWNER && repo === EXPECTED_REPO && branch === EXPECTED_BRANCH

  const lastDeploy = p.latest_deployment?.created_on
    ? new Date(p.latest_deployment.created_on).toLocaleDateString()
    : 'never'

  const deployStatus = p.latest_deployment?.stage?.status ?? 'unknown'

  if (ok) {
    OK.push({ name: p.name, lastDeploy, deployStatus })
  } else {
    FAIL.push({ name: p.name, owner, repo, branch, lastDeploy, deployStatus })
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
const W = 32

if (OK.length) {
  console.log(`  ✅  Connected correctly (${OK.length})`)
  console.log('  ' + '─'.repeat(60))
  for (const p of OK) {
    const deploy = `last deploy: ${p.lastDeploy}  [${p.deployStatus}]`
    console.log(`  ${p.name.padEnd(W)} ${deploy}`)
  }
}

if (FAIL.length) {
  console.log(`\n  ❌  Disconnected or wrong repo (${FAIL.length})`)
  console.log('  ' + '─'.repeat(60))
  for (const p of FAIL) {
    console.log(`  ${p.name}`)
    console.log(`     connected to: ${p.owner}/${p.repo} (branch: ${p.branch})`)
    console.log(`     expected:     ${EXPECTED_OWNER}/${EXPECTED_REPO} (branch: ${EXPECTED_BRANCH})`)
    console.log(`     last deploy:  ${p.lastDeploy}  [${p.deployStatus}]`)
    console.log()
  }
  console.log(`  Fix with:`)
  for (const p of FAIL) {
    console.log(`    node scripts/fix-github-source.mjs ${p.name}`)
  }
} else {
  console.log('\n  All connections look good.')
}

console.log()
