#!/usr/bin/env node
/**
 * retag-mediums.mjs — apply medium genre tags to existing artworks based on their medium field
 *
 * Usage:
 *   node scripts/retag-mediums.mjs --token <password> [--url <site>] [--dry-run]
 */

const args   = process.argv.slice(2)
const getArg = name => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : null }
const token  = getArg('--token')
const baseUrl = getArg('--url') || 'https://artie-taylor-mershon.pages.dev'
const dryRun  = args.includes('--dry-run')

if (!token) {
  console.error('Usage: node scripts/retag-mediums.mjs --token <password> [--url <url>] [--dry-run]')
  process.exit(1)
}

const MEDIUM_GENRE_MAP = {
  'graphite':    'pencil',
  'charcoal':    'charcoal',
  'watercolor':  'watercolor',
  'watercolour': 'watercolor',
  'acrylic':     'acrylic',
  'gouache':     'gouache',
  'pastel':      'pastel',
  'oil':         'oil',
  'ink':         'ink',
  'pen':         'ink',
  'pencil':      'pencil',
  'pencils':     'pencil',
  'gel':         'pencil',
  'digital':     'digital art',
  'mixed':       'mixed media',
  'encaustic':   'encaustic',
  'tempera':     'tempera',
  'sculpture':   'sculpture',
}

async function apiGet(endpoint) {
  const res = await fetch(`${baseUrl}${endpoint}`, { headers: { 'X-Admin-Token': token } })
  if (!res.ok) throw new Error(`GET ${endpoint}: ${res.status}`)
  return res.json()
}

async function putGenres(artworkId, genreIds) {
  const res = await fetch(`${baseUrl}/api/artworks/${artworkId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify({ genres: genreIds }),
  })
  if (!res.ok) throw new Error(`PUT artwork ${artworkId}: ${res.status} ${await res.text()}`)
  return res.json()
}

// Keywords that need word-boundary matching (to avoid "pen" matching "pencil", etc.)
const WHOLE_WORD_KEYS = new Set(['pen', 'oil', 'ink', 'gel'])

function inferMediumGenreIds(medium, mediumGenres) {
  if (!medium) return []
  const mLower = medium.toLowerCase()
  const matched = new Set()
  for (const [kw, genreName] of Object.entries(MEDIUM_GENRE_MAP)) {
    const hit = WHOLE_WORD_KEYS.has(kw)
      ? new RegExp(`\\b${kw}\\b`).test(mLower)
      : mLower.includes(kw)
    if (hit) {
      const g = mediumGenres.find(g => g.name.toLowerCase() === genreName)
      if (g) matched.add(g.id)
    }
  }
  return [...matched]
}

async function main() {
  const [{ artworks }, { genres }] = await Promise.all([
    apiGet('/api/artworks'),
    apiGet('/api/genres'),
  ])

  const mediumGenres = genres.filter(g => g.tag_type === 'medium')
  console.log(`✓ ${artworks.length} artworks, ${mediumGenres.length} medium genres\n`)
  if (dryRun) console.log('── DRY RUN ──\n')

  let tagged = 0, skipped = 0, failed = 0

  for (const aw of artworks) {
    if (!aw.medium) { skipped++; continue }

    const inferredIds  = inferMediumGenreIds(aw.medium, mediumGenres)
    const existingIds  = (aw.genres || []).map(g => g.id)
    const existingSet  = new Set(existingIds)
    const toAdd        = inferredIds.filter(id => !existingSet.has(id))

    if (toAdd.length === 0) { skipped++; continue }

    const names    = toAdd.map(id => mediumGenres.find(g => g.id === id)?.name).filter(Boolean)
    const mergedIds = [...existingIds, ...toAdd]
    console.log(`  "${aw.title}" → +[${names.join(', ')}]`)

    if (!dryRun) {
      try { await putGenres(aw.id, mergedIds) }
      catch (e) { console.log(`    ✗ ${e.message}`); failed++; continue }
    }
    tagged++
  }

  console.log(`\n── Done ──`)
  console.log(`✓ ${tagged} artworks tagged`)
  if (failed)  console.log(`✗ ${failed} failed`)
  console.log(`  ${skipped} skipped (no medium or already tagged)`)
}

main().catch(e => { console.error(e); process.exit(1) })
