/**
 * Artie Artist Registry
 *
 * Reads/writes scripts/artists.json — the source of truth for every
 * provisioned artist: slug, DB ID, status, trial info, contact email.
 *
 * Used by provision.mjs, decommission.mjs, and upgrade.mjs.
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const REGISTRY   = path.join(__dirname, 'artists.json')

/** Load the registry. Returns [] if the file doesn't exist yet. */
export function loadRegistry() {
  if (!fs.existsSync(REGISTRY)) return []
  return JSON.parse(fs.readFileSync(REGISTRY, 'utf8'))
}

/** Persist the registry. */
export function saveRegistry(entries) {
  fs.writeFileSync(REGISTRY, JSON.stringify(entries, null, 2) + '\n')
}

/** Find an entry by slug. */
export function findBySlug(slug) {
  return loadRegistry().find(e => e.slug === slug) ?? null
}

/** Add or update an entry (matched by slug). */
export function upsert(entry) {
  const entries = loadRegistry()
  const idx     = entries.findIndex(e => e.slug === entry.slug)
  if (idx === -1) {
    entries.push({ ...entry, created_at: new Date().toISOString() })
  } else {
    entries[idx] = { ...entries[idx], ...entry, updated_at: new Date().toISOString() }
  }
  saveRegistry(entries)
}

/** Mark an entry as decommissioned (keeps it for history). */
export function markDecommissioned(slug) {
  upsert({ slug, status: 'decommissioned', decommissioned_at: new Date().toISOString() })
}

/**
 * Given a desired base slug, return a slug that isn't already in use.
 * e.g. "jane-smith" → "jane-smith" (if free), or "jane-smith-2", "jane-smith-3", etc.
 */
export function resolveSlug(baseSlug) {
  const entries     = loadRegistry()
  const activeSlugs = new Set(
    entries.filter(e => e.status !== 'decommissioned').map(e => e.slug)
  )
  if (!activeSlugs.has(baseSlug)) return baseSlug
  let n = 2
  while (activeSlugs.has(`${baseSlug}-${n}`)) n++
  return `${baseSlug}-${n}`
}

/** Pretty-print the registry as a table. */
export function printRegistry() {
  const entries = loadRegistry()
  if (entries.length === 0) { console.log('  (no artists provisioned yet)'); return }

  const active        = entries.filter(e => e.status !== 'decommissioned')
  const decommissioned = entries.filter(e => e.status === 'decommissioned')

  console.log('\n  Active artists:')
  console.log('  ' + '─'.repeat(72))
  for (const e of active) {
    const trial = e.status === 'trial'
      ? `  [trial → expires ${e.trial_expires}]`
      : e.status === 'paid' ? '  [paid]' : `  [${e.status}]`
    console.log(`  ${e.name.padEnd(22)} ${e.slug.padEnd(24)} ${trial}`)
  }
  if (decommissioned.length) {
    console.log(`\n  Decommissioned: ${decommissioned.map(e => e.slug).join(', ')}`)
  }
  console.log()
}
