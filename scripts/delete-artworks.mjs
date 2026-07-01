#!/usr/bin/env node
/**
 * delete-artworks.mjs — delete artworks matching a title prefix or custom field value
 *
 * Usage:
 *   node scripts/delete-artworks.mjs --token <pw> --prefix "Creatures"
 *   node scripts/delete-artworks.mjs --token <pw> --type books
 *   node scripts/delete-artworks.mjs --token <pw> --type books --prefix "Creatures"
 *   [--dry-run]  [--url <site>]
 */

const args    = process.argv.slice(2)
const getArg  = name => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : null }
const token   = getArg('--token')
const baseUrl = getArg('--url')    || 'https://artie-taylor-mershon.pages.dev'
const prefix  = getArg('--prefix') || ''
const typeVal = getArg('--type')   || ''
const dryRun  = args.includes('--dry-run')

if (!token) { console.error('Usage: node scripts/delete-artworks.mjs --token <pw> [--prefix <title>] [--type <medium-type>] [--dry-run]'); process.exit(1) }
if (!prefix && !typeVal) { console.error('Provide --prefix and/or --type to avoid deleting everything'); process.exit(1) }

async function apiGet(ep) {
  const r = await fetch(`${baseUrl}${ep}`, { headers: { 'X-Admin-Token': token } })
  if (!r.ok) throw new Error(`GET ${ep}: ${r.status}`)
  return r.json()
}

async function deleteArtwork(id) {
  const r = await fetch(`${baseUrl}/api/artworks/${id}`, {
    method: 'DELETE', headers: { 'X-Admin-Token': token }
  })
  if (!r.ok) throw new Error(`DELETE ${id}: ${r.status} ${await r.text()}`)
}

const { artworks } = await apiGet('/api/artworks')

const targets = artworks.filter(aw => {
  const titleMatch  = prefix   ? aw.title.toLowerCase().startsWith(prefix.toLowerCase()) : true
  const typeMatch   = typeVal  ? (aw.custom_fields || []).some(f => f.value === typeVal)  : true
  return titleMatch && typeMatch
})

if (targets.length === 0) { console.log('No artworks matched.'); process.exit(0) }

console.log(`${dryRun ? 'DRY RUN — ' : ''}Deleting ${targets.length} artworks:\n`)
for (const aw of targets) console.log(`  [${aw.id}] "${aw.title}"`)
console.log()

if (dryRun) { console.log('(dry run — nothing deleted)'); process.exit(0) }

let ok = 0, fail = 0
for (const aw of targets) {
  try   { await deleteArtwork(aw.id); console.log(`✓ deleted "${aw.title}"`); ok++ }
  catch (e) { console.log(`✗ "${aw.title}": ${e.message}`); fail++ }
  await new Promise(r => setTimeout(r, 100))
}
console.log(`\n✓ ${ok} deleted${fail ? `  ✗ ${fail} failed` : ''}`)
