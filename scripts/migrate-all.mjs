#!/usr/bin/env node
/**
 * Artie – Run a migration against all active artist databases
 *
 * Usage:
 *   node scripts/migrate-all.mjs migrations/0023_new_feature.sql
 *
 * Reads scripts/artists.json for the list of active artists.
 * Skips decommissioned artists.
 */

import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { loadRegistry } from './registry.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')

const migrationFile = process.argv[2]
if (!migrationFile) {
  console.error('\nUsage: node scripts/migrate-all.mjs <migration-file>')
  console.error('Example: node scripts/migrate-all.mjs migrations/0023_new_feature.sql\n')
  process.exit(1)
}

const fullPath = path.resolve(ROOT, migrationFile)
if (!fs.existsSync(fullPath)) {
  console.error(`\n❌  Migration file not found: ${migrationFile}\n`)
  process.exit(1)
}

const artists = loadRegistry().filter(a => a.status !== 'decommissioned')
if (artists.length === 0) {
  console.error('\n❌  No active artists in scripts/artists.json\n')
  process.exit(1)
}

console.log(`\nArtie – Running: ${migrationFile}`)
console.log(`─────────────────────────────────────────────────────`)

let ok = 0, failed = 0

for (const artist of artists) {
  const dbName     = `artie-${artist.slug}-db`
  const configFile = path.join(ROOT, `wrangler-${artist.slug}.toml`)

  if (!fs.existsSync(configFile)) {
    console.log(`\n  SKIP  ${artist.name} — wrangler-${artist.slug}.toml not found`)
    failed++
    continue
  }

  process.stdout.write(`\n  → ${artist.name} (${dbName})... `)
  try {
    execSync(
      `npx wrangler d1 execute ${dbName} --remote ` +
      `--file="${fullPath}" --config="${configFile}" --yes`,
      { cwd: ROOT, stdio: 'pipe' }
    )
    console.log('✓')
    ok++
  } catch (e) {
    console.log('✗')
    console.log(`    ${e.stderr?.toString().trim().split('\n').pop() ?? e.message}`)
    failed++
  }
}

console.log(`\n─────────────────────────────────────────────────────`)
console.log(`  ${ok} succeeded, ${failed} failed\n`)
if (failed > 0) process.exit(1)
