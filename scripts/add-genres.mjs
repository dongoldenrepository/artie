#!/usr/bin/env node
/**
 * add-genres.mjs — add subject genre tags to an Artie site
 * Usage: node scripts/add-genres.mjs --token <password> [--url <site>]
 */

const args    = process.argv.slice(2)
const getArg  = name => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : null }
const token   = getArg('--token')
const baseUrl = getArg('--url') || 'https://artie-taylor-mershon.pages.dev'

if (!token) { console.error('Usage: node scripts/add-genres.mjs --token <password> [--url <url>]'); process.exit(1) }

const genres = [
  { name: 'Illustration', color: '#f97316', tag_type: 'subject' },
  { name: 'Whimsical',    color: '#a855f7', tag_type: 'subject' },
  { name: 'Fantasy',      color: '#7c3aed', tag_type: 'subject' },
  { name: "Children's",   color: '#fbbf24', tag_type: 'subject' },
]

for (const g of genres) {
  const res = await fetch(`${baseUrl}/api/genres`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify(g),
  })
  const json = await res.json()
  if (res.ok) console.log(`✓ Added "${g.name}" id=${json.id}`)
  else        console.log(`✗ "${g.name}": ${json.error}`)
}
