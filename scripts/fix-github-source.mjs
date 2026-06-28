#!/usr/bin/env node
/**
 * Fix the GitHub source connection for a Pages project.
 * Usage: node scripts/fix-github-source.mjs <project-name>
 * Example: node scripts/fix-github-source.mjs artie-taylor-mershon
 */

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN  = process.env.CLOUDFLARE_API_TOKEN
const GITHUB_OWNER  = 'dongoldenrepository'
const GITHUB_REPO   = 'artie'

const projectName = process.argv[2]
if (!projectName) { console.error('Usage: node scripts/fix-github-source.mjs <project-name>'); process.exit(1) }
if (!CF_ACCOUNT_ID || !CF_API_TOKEN) { console.error('Missing CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN'); process.exit(1) }

const res = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${projectName}`,
  {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: {
        type: 'github',
        config: {
          owner:             GITHUB_OWNER,
          repo_name:         GITHUB_REPO,
          production_branch: 'main',
          pr_comments_enabled: false,
          deployments_enabled: true,
        },
      },
    }),
  }
)
const json = await res.json()
if (!json.success) {
  console.error('❌ API error:', JSON.stringify(json.errors ?? json, null, 2))
  process.exit(1)
}
const src = json.result?.source?.config
console.log(`✓ ${projectName} now connected to ${src?.owner}/${src?.repo_name} (branch: ${src?.production_branch})`)
