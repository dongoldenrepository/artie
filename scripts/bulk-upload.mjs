#!/usr/bin/env node
/**
 * bulk-upload.mjs — upload a folder of artwork images to an Artie site
 *
 * Two subfolder modes (--mode flag):
 *
 *   per-image  (default — drawings, paintings, etc.)
 *     Each image inside a named subfolder = its own artwork.
 *     Folder name supplies shared medium + year; title = "Folder Title - Filename".
 *
 *   per-folder  (books, sculpture series, etc.)
 *     Each named subfolder = one artwork.
 *     Folder name parsed for title / medium / year.
 *     First image = primary; remaining images = extra views of the same piece.
 *
 * In both modes, loose images at the root and images in "generic" subfolders
 * (misc, other, various, unsorted) become individual artworks with filename-parsed metadata.
 *
 * Skips files with "_resized" in the name (pre-resized duplicates).
 * Filenames are normalized (lowercase, spaces → underscores) before upload.
 *
 * Usage:
 *   node scripts/bulk-upload.mjs \
 *     --folder   "/path/to/drawings" \
 *     --type     "drawings" \
 *     --token    "MyArtie2026" \
 *     [--mode    per-image|per-folder]  (default: per-image) \
 *     [--tags    "Illustration,Children's"]  forced genres on every artwork \
 *     [--max-px  2000]   resize longest side to this many pixels (default: 2000 — always on) \
 *     [--no-resize]      disable resizing, upload originals as-is \
 *     [--skip-generic]   skip files with auto-generated names (UUIDs, img_XXXX, frame_N, etc.) \
 *                        and write a skipped-<folder>-<date>.md report \
 *     [--url     "https://artie-taylor-mershon.pages.dev"] \
 *     [--dry-run]
 *
 * Resizing is alpha-aware: images with a transparent background (PNG/WebP/GIF
 * logos, cutouts, etc.) are resized but re-encoded as PNG so transparency is
 * preserved. Only images with no alpha channel (ordinary photos/scans) are
 * re-encoded as JPEG. This matters because naively resizing everything to
 * JPEG silently flattens transparent pixels to a solid (usually black)
 * background — the resize step must never do that.
 *
 * Requires: npm install --save-dev sharp   (for resizing; on by default)
 */

import fs   from 'fs'
import path from 'path'

// FormData and Blob are globals in Node 18+

// Lazy-load sharp only when resizing is requested
let sharp = null
async function loadSharp() {
  if (sharp) return sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.error('✗ sharp not installed. Run: npm install --save-dev sharp')
    process.exit(1)
  }
  return sharp
}

// ── Args ──────────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2)
const getArg  = name => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : null }

const folder   = getArg('--folder')
const type     = getArg('--type')
const token    = getArg('--token')
const baseUrl  = getArg('--url')    || 'https://artie-taylor-mershon.pages.dev'
const mode     = getArg('--mode')   || 'per-image'   // 'per-image' | 'per-folder'
const tagsArg  = getArg('--tags')   || ''            // comma-separated genre names forced onto every artwork
const DEFAULT_MAX_PX = 2000
const noResize    = args.includes('--no-resize')
const maxPx       = noResize ? null : (getArg('--max-px') ? Number(getArg('--max-px')) : DEFAULT_MAX_PX)  // resize longest side; on by default
const onlyDir     = getArg('--only')  || ''   // process only this subfolder name (case-insensitive)
const skipGeneric = args.includes('--skip-generic')  // skip auto-named files and write report
const dryRun      = args.includes('--dry-run')

if (!folder || !type || !token) {
  console.error('Usage: node scripts/bulk-upload.mjs --folder <path> --type <medium-type> --token <password> [--mode per-image|per-folder] [--url <url>] [--dry-run]')
  process.exit(1)
}
if (!['per-image', 'per-folder'].includes(mode)) {
  console.error('--mode must be per-image or per-folder'); process.exit(1)
}

// ── Constants ─────────────────────────────────────────────────────────────────
const IMAGE_EXTS     = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.tiff', '.tif'])
const GENERIC_DIRS   = new Set(['misc', 'miscellaneous', 'other', 'various', 'unsorted', 'extras'])

// Medium keywords that signal the start of a medium description.
// Ordered carefully — longer/more-specific first to avoid early false matches.
// "pen" alone is ambiguous (can appear in title like "pen drawing"); we only
// treat it as a medium start when followed by "and" or "ink".
const MEDIUM_STARTERS = [
  'graphite', 'charcoal', 'watercolor', 'watercolour', 'acrylic', 'gouache',
  'encaustic', 'tempera', 'pastel', 'oil', 'colored', 'colour', 'color',
  'crayon', 'marker', 'chalk', 'digital', 'mixed',
  'pencil', 'pencils', 'gel', 'ink',
]
// Reliable medium terminators — "on X" anchors the end of the medium section
const ON_SURFACE = /\bon\s+(paper|canvas|board|linen|wood|panel|fabric|vellum|mylar)\b/i

// ── Helpers ───────────────────────────────────────────────────────────────────
const isImage     = f => IMAGE_EXTS.has(path.extname(f).toLowerCase())
const isResized   = f => f.toLowerCase().includes('_resized')

// Filenames that are clearly auto-generated and not meaningful artwork titles
const GENERIC_FILENAME_RE = /^([0-9a-f]{8}-[0-9a-f]{4}|img_\d|frame_\d|asset_\d|\d{4}[-_]\d{2}[-_]\d{2}|photo_(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|[_\d]))/i
function isGenericFilename(basename) {
  // Normalize to lowercase+underscores before testing so "Frame 1.jpg" matches frame_\d
  const stem = path.basename(basename, path.extname(basename))
    .toLowerCase()
    .replace(/[\s,]+/g, '_')
  return GENERIC_FILENAME_RE.test(stem)
}

/** lowercase + spaces→underscores + strip non-portable chars, keep extension */
function normalizeFilename(filename) {
  const ext  = path.extname(filename).toLowerCase()
  const base = path.basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]/g, '')
  return base + ext
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

const trimPunct = str => str.replace(/[\s\-,\.]+$/, '').replace(/^[\s\-,\.]+/, '').trim()

/**
 * Parse a descriptive name (folder or filename stem) into { title, medium, year }.
 *
 * Examples:
 *   "apple study - graphite and charcoal on paper - 2023"
 *     → { title: "Apple Study", medium: "Graphite And Charcoal On Paper", year: "2023" }
 *   "valmont pen drawing 2021 pen and ink on paper"
 *     → { title: "Valmont Pen Drawing", medium: "Pen And Ink On Paper", year: "2021" }
 *   "malcolm in swing 2023 graphite"
 *     → { title: "Malcolm In Swing", medium: "Graphite", year: "2023" }
 */
function parseName(name) {
  let s = name.trim()

  // 1. Extract year
  const yearMatch = s.match(/\b(20\d{2})\b/)
  const year      = yearMatch ? yearMatch[1] : null
  if (yearMatch) s = s.replace(yearMatch[0], '').trim()

  // 2. Normalize separators
  // Convert + to " and ", collapse spaced dashes " - " to spaces,
  // but preserve word-internal hyphens (e.g. "rose-color")
  s = s.replace(/\s*\+\s*/g, ' and ')       // + → and
       .replace(/\s+-\s+/g, ' ')            // spaced dashes → space
       .replace(/\s+/g, ' ').trim()

  // 3. Find "on paper/canvas/…" anchor — reliable medium terminator
  const onMatch = ON_SURFACE.exec(s)

  let mediumStartIdx = -1
  const words = s.split(' ')

  if (onMatch) {
    // Work backwards from "on <surface>" to find the earliest medium starter
    // that is part of the same phrase
    const onWordIdx = s.slice(0, onMatch.index).split(' ').length - 1

    // Look for a medium starter in the words before "on"
    for (let i = 0; i < onWordIdx; i++) {
      const w = words[i].toLowerCase().replace(/[^a-z]/g, '')
      if (MEDIUM_STARTERS.includes(w)) { mediumStartIdx = i; break }
      // "pen and ink" — catch "pen" only when "and" follows
      if (w === 'pen' && words[i + 1]?.toLowerCase() === 'and') { mediumStartIdx = i; break }
    }
    // If no starter found before "on", medium starts at "on"
    if (mediumStartIdx === -1) mediumStartIdx = onWordIdx
  } else {
    // No "on <surface>" — scan for MEDIUM_STARTERS normally
    for (let i = 0; i < words.length; i++) {
      const w = words[i].toLowerCase().replace(/[^a-z]/g, '')
      if (MEDIUM_STARTERS.includes(w)) { mediumStartIdx = i; break }
      if (w === 'pen' && words[i + 1]?.toLowerCase() === 'and') { mediumStartIdx = i; break }
    }
  }

  let title, medium
  if (mediumStartIdx > 0) {
    title  = toTitleCase(trimPunct(words.slice(0, mediumStartIdx).join(' ')))
    medium = toTitleCase(trimPunct(words.slice(mediumStartIdx).join(' ')))
  } else {
    title  = toTitleCase(trimPunct(s.replace(/[_]+/g, ' ')))
    medium = null
  }

  return { title: title || toTitleCase(name), medium, year }
}

function titleFromFilename(filename) {
  const base = path.basename(filename, path.extname(filename))
  // Strip trailing year, normalize separators
  const s = base.replace(/[-_\s]*20\d{2}\s*$/, '').replace(/[_]+/g, ' ').trim()
  return s || base
}

// ── Genre inference ───────────────────────────────────────────────────────────
const STOP_WORDS = new Set(['the','a','an','and','or','of','in','on','at','to','for',
                             'with','by','from','book','art','work'])

// Title keyword → genre name synonyms (lowercase)
const SYNONYMS = {
  'airplane': 'aircraft', 'plane': 'aircraft', 'planes': 'aircraft', 'airplanes': 'aircraft',
  'creature': 'animals',  'creatures': 'animals', 'farm': 'animals', 'pet': 'animals',
  'nature': 'botanical',  'plant': 'botanical', 'flower': 'floral', 'floral': 'floral',
  'city': 'cityscape',    'town': 'cityscape',
  'sea': 'seascape',      'ocean': 'seascape', 'coast': 'marine',
  'person': 'portrait',   'figure': 'figurative', 'human': 'figurative',
  'bug': 'insects',       'insect': 'insects',
  'bird': 'birds',        'birds': 'birds',
  'vehicle': 'vehicles',  'car': 'vehicles', 'truck': 'vehicles',
  'space': 'astro',       'star': 'astro',
  'weird': 'whimsical',   'whimsy': 'whimsical', 'fantasy': 'fantasy',
  'story': 'illustration','drawing': 'illustration',
}

// Medium text keyword → medium genre name
const MEDIUM_GENRE_MAP = {
  'graphite':    'pencil',      // graphite → Pencil
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

const WHOLE_WORD_KEYS = new Set(['pen', 'oil', 'ink', 'gel'])

/** Return medium genre IDs inferred from a parsed medium string */
function inferMediumGenres(medium, allGenres) {
  if (!medium) return []
  const mLower = medium.toLowerCase()
  const mediumGenres = allGenres.filter(g => g.tag_type === 'medium')
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

/**
 * Return genre IDs for an artwork title.
 * Combines: (1) --tags forced genres, (2) direct word match, (3) synonym map.
 * forcedIds are always included regardless of title.
 */
function inferGenres(title, genres, forcedIds = []) {
  const cleanTitle = title.toLowerCase().replace(/\bbook\b/g, '').trim()
  const titleWords = cleanTitle.split(/\W+/).filter(w => w.length > 2 && !STOP_WORDS.has(w))

  const matched = new Set(forcedIds)

  if (titleWords.length > 0) {
    for (const g of genres) {
      const genreWords = g.name.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !STOP_WORDS.has(w))
      const directHit = genreWords.some(gw =>
        titleWords.some(tw => tw === gw || tw.startsWith(gw) || gw.startsWith(tw))
      )
      if (directHit) { matched.add(g.id); continue }

      // Synonym expansion: map title word to a genre name, then look it up
      for (const tw of titleWords) {
        const mapped = SYNONYMS[tw]
        if (mapped && g.name.toLowerCase() === mapped) { matched.add(g.id); break }
      }
    }
  }

  return [...matched]
}

// ── API calls ─────────────────────────────────────────────────────────────────
async function apiGet(endpoint) {
  const res = await fetch(`${baseUrl}${endpoint}`, { headers: { 'X-Admin-Token': token } })
  if (!res.ok) throw new Error(`GET ${endpoint}: ${res.status}`)
  return res.json()
}

async function uploadImage(filePath) {
  let buf = fs.readFileSync(filePath)
  const ext = path.extname(filePath).toLowerCase()

  const EXT_MIME = { '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
                     '.heic': 'image/heic', '.heif': 'image/heif' }
  let mimeType = EXT_MIME[ext] || 'image/jpeg'
  let outExt   = (ext || '.jpg').slice(1)  // extension actually written to R2, kept in sync with mimeType below

  if (maxPx) {
    const sh  = await loadSharp()
    const img = sh(buf).rotate()   // auto-orient from EXIF; doesn't consume the pipeline
    let hasAlpha = false
    try {
      hasAlpha = !!(await img.metadata()).hasAlpha
    } catch {
      // Unreadable metadata (corrupt/unsupported file) — fall through and
      // treat as opaque rather than risk crashing the whole import run.
    }

    if (hasAlpha) {
      // Never flatten transparent pixels to JPEG — that bakes a solid
      // (usually black) background into the file permanently. Resize but
      // keep the alpha channel by re-encoding as PNG.
      buf = await img
        .resize({ width: maxPx, height: maxPx, fit: 'inside', withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer()
      mimeType = 'image/png'
      outExt   = 'png'
    } else {
      buf = await img
        .resize({ width: maxPx, height: maxPx, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()
      mimeType = 'image/jpeg'
      outExt   = 'jpg'
    }
  }

  const blob = new Blob([buf], { type: mimeType })
  const fd   = new FormData()
  fd.append('image', blob, normalizeFilename(path.basename(filePath)).replace(/\.[^.]+$/, `.${outExt}`))

  const res = await fetch(`${baseUrl}/api/images/upload`, {
    method:  'POST',
    headers: { 'X-Admin-Token': token },
    body:    fd,
  })
  if (!res.ok) throw new Error(`Image upload: ${res.status} ${await res.text()}`)
  return res.json() // { key }
}

async function createArtwork({ title, medium, year, imageKey, mediumTypeFieldId, mediumTypeValue, genres = [] }) {
  const res = await fetch(`${baseUrl}/api/artworks`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify({
      title,
      medium:        medium || null,
      date_created:  year   || null,
      image_key:     imageKey,
      is_available:  1,
      artwork_type:  'artwork',
      genres,
      custom_values: mediumTypeFieldId ? { [mediumTypeFieldId]: mediumTypeValue } : {},
    }),
  })
  if (!res.ok) throw new Error(`Create artwork: ${res.status} ${await res.text()}`)
  return res.json()
}

async function addExtraImage(artworkId, imageKey, sortOrder) {
  const res = await fetch(`${baseUrl}/api/artwork-images`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify({ artwork_id: artworkId, image_key: imageKey, sort_order: sortOrder }),
  })
  if (!res.ok) throw new Error(`Extra image: ${res.status} ${await res.text()}`)
}

// ── Scan folder ───────────────────────────────────────────────────────────────
function scanFolder(folderPath, skipped = []) {
  const entries  = fs.readdirSync(folderPath, { withFileTypes: true })
  const artworks = []

  function filterImages(files, dirLabel) {
    const kept = [], dropped = []
    for (const f of files) {
      if (skipGeneric && isGenericFilename(path.basename(f))) dropped.push({ file: f, folder: dirLabel })
      else kept.push(f)
    }
    skipped.push(...dropped)
    return kept
  }

  // Subfolders
  const subdirs = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .filter(e => !onlyDir || e.name.toLowerCase() === onlyDir.toLowerCase())
    .sort((a, b) => a.name.localeCompare(b.name))

  for (const dir of subdirs) {
    const dirPath = path.join(folderPath, dir.name)
    const rawImages = fs.readdirSync(dirPath)
      .filter(f => isImage(f) && !f.startsWith('.') && !isResized(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map(f => path.join(dirPath, f))
    const images = filterImages(rawImages, dir.name)
    if (images.length === 0) continue

    const isGeneric = GENERIC_DIRS.has(dir.name.toLowerCase().trim())

    if (isGeneric) {
      // Treat each image as its own artwork, parse filename for metadata
      for (const imgPath of images) {
        const stem = path.basename(imgPath, path.extname(imgPath))
        const { title, medium, year } = parseName(stem)
        artworks.push({ title, medium, year, images: [imgPath], source: path.basename(imgPath) })
      }
    } else if (mode === 'per-folder') {
      // per-folder: whole subfolder = one artwork (e.g. a book)
      // First image = primary; rest = extra views of the same piece
      const { title, medium, year } = parseName(dir.name)
      artworks.push({ title, medium, year, images, source: dir.name })
    } else {
      // per-image (default): each image = its own artwork; folder gives shared medium + year
      const { title: folderTitle, medium, year } = parseName(dir.name)
      for (const imgPath of images) {
        const stem = path.basename(imgPath, path.extname(imgPath))
        const rawLabel = trimPunct(toTitleCase(
          stem.replace(/[-_\s]*20\d{2}\s*$/, '').replace(/[_]+/g, ' ').trim()
        ))
        // Strip echoed folder title from file label (e.g. folder "Apple Study", file "apple_study_sketch_a" → "Sketch A")
        let cleanLabel = rawLabel
        if (rawLabel.toLowerCase().startsWith(folderTitle.toLowerCase())) {
          cleanLabel = toTitleCase(trimPunct(rawLabel.slice(folderTitle.length).replace(/^[\s\-–—]+/, '')))
        }
        const title = cleanLabel ? `${folderTitle} - ${cleanLabel}` : folderTitle
        artworks.push({ title, medium, year, images: [imgPath], source: `${dir.name} / ${path.basename(imgPath)}` })
      }
    }
  }

  // Loose image files at root
  const looseRaw = entries
    .filter(e => e.isFile() && isImage(e.name) && !e.name.startsWith('.') && !isResized(e.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
    .map(e => path.join(folderPath, e.name))
  const loose = filterImages(looseRaw, '(root)')

  for (const filePath of loose) {
    const stem = path.basename(filePath, path.extname(filePath))
    const { title, medium, year } = parseName(stem)
    artworks.push({ title, medium, year, images: [filePath], source: path.basename(filePath) })
  }

  return artworks
}

// ── Skip report ───────────────────────────────────────────────────────────────
function writeSkipReport(skipped, folderPath) {
  if (!skipped.length) return
  const folderName = path.basename(folderPath)
  const date       = new Date().toISOString().slice(0, 10)
  const reportPath = path.join(process.cwd(), `skipped-${folderName}-${date}.md`)

  const byFolder = {}
  for (const { file, folder: f } of skipped) {
    if (!byFolder[f]) byFolder[f] = []
    byFolder[f].push(path.basename(file))
  }

  const lines = [
    `# Skipped Files — ${folderName} (${date})`,
    '',
    'These files were skipped during bulk upload because their filenames are',
    'auto-generated (UUIDs, img_XXXX, frame_N, photo_date, etc.) and would not',
    'produce useful artwork titles.',
    '',
    '## How to add them',
    '',
    '1. Rename each file to a descriptive name, e.g.:',
    '   `img_0088.jpg` → `sunset-over-mountains-procreate-2023.jpg`',
    '2. Re-run the bulk upload script for those files, or',
    '3. Upload them individually via the Admin panel on the site.',
    '',
    '## Skipped files by folder',
    '',
  ]

  for (const [fld, files] of Object.entries(byFolder)) {
    lines.push(`### ${fld}`)
    lines.push('')
    for (const f of files) lines.push(`- \`${f}\``)
    lines.push('')
  }

  fs.writeFileSync(reportPath, lines.join('\n'))
  console.log(`\n📋 Skip report written: ${reportPath}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(folder)) { console.error(`Folder not found: ${folder}`); process.exit(1) }

  const skipped     = []
  const artworks    = scanFolder(folder, skipped)
  const totalImages = artworks.reduce((n, a) => n + a.images.length, 0)

  if (artworks.length === 0 && skipped.length === 0) { console.log('No artwork found.'); return }

  console.log(`\n📁 Folder      : ${folder}`)
  console.log(`🎨 Medium Type : ${type}`)
  console.log(`🌐 Site        : ${baseUrl}`)
  console.log(`🖼  Artworks    : ${artworks.length}  (${totalImages} total images)`)
  if (skipped.length) console.log(`⏭  Skipped     : ${skipped.length} auto-named files (see report)`)
  console.log()

  // Fetch all genres for tag inference (subject + medium)
  let allGenres = [], subjectGenres = [], forcedGenreIds = []
  try {
    const { genres } = await apiGet('/api/genres')
    allGenres     = genres || []
    subjectGenres = allGenres.filter(g => g.tag_type === 'subject')
    if (allGenres.length > 0)
      console.log(`✓ Loaded ${allGenres.length} genres for tag inference`)
  } catch (e) {
    console.warn(`⚠️  Could not fetch genres: ${e.message}`)
  }

  // Resolve --tags names → IDs
  if (tagsArg) {
    const tagNames = tagsArg.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    forcedGenreIds = subjectGenres
      .filter(g => tagNames.includes(g.name.toLowerCase()))
      .map(g => g.id)
    const foundNames = forcedGenreIds.map(id => subjectGenres.find(g => g.id === id)?.name)
    const missing    = tagNames.filter(n => !subjectGenres.some(g => g.name.toLowerCase() === n))
    console.log(`✓ Forced tags: ${foundNames.join(', ') || '(none matched)'}`)
    if (missing.length) console.warn(`⚠️  Unknown tag names: ${missing.join(', ')}`)
  }
  console.log()

  if (dryRun) {
    console.log('── DRY RUN — nothing will be uploaded ──\n')
    for (const aw of artworks) {
      const subjectIds    = inferGenres(aw.title, subjectGenres, forcedGenreIds)
      const mediumIds     = inferMediumGenres(aw.medium, allGenres)
      const matchedGenres = [...new Set([...subjectIds, ...mediumIds])]
      const genreNames    = matchedGenres.map(id => allGenres.find(g => g.id === id)?.name).filter(Boolean)
      console.log(`  🖼  "${aw.title}"`)
      console.log(`     Medium : ${aw.medium || '(none)'}`)
      console.log(`     Year   : ${aw.year   || '(none)'}`)
      console.log(`     Tags   : ${genreNames.length ? genreNames.join(', ') : '(none)'}`)
      if (aw.images.length === 1) {
        console.log(`     File   : ${normalizeFilename(path.basename(aw.images[0]))}`)
      } else {
        console.log(`     Images : ${aw.images.length}`)
        aw.images.forEach((f, i) =>
          console.log(`       ${i === 0 ? 'primary' : `extra ${i} `} : ${normalizeFilename(path.basename(f))}`)
        )
      }
      console.log()
    }
    writeSkipReport(skipped, folder)
    return
  }

  // Fetch Medium Type field ID
  let mediumTypeFieldId = null
  try {
    const { fields } = await apiGet('/api/custom-fields')
    const field = fields.find(f => f.name === 'Medium Type' && f.field_type === 'select')
    if (field) { mediumTypeFieldId = field.id; console.log(`✓ Medium Type field id=${mediumTypeFieldId}\n`) }
    else console.warn('⚠️  Medium Type field not found — uploading without it\n')
  } catch (e) {
    console.warn(`⚠️  Could not fetch custom fields: ${e.message}\n`)
  }

  let succeeded = 0, failed = 0

  for (let i = 0; i < artworks.length; i++) {
    const aw          = artworks[i]
    const num         = `[${i + 1}/${artworks.length}]`
    const subjectIds  = inferGenres(aw.title, subjectGenres, forcedGenreIds)
    const mediumIds   = inferMediumGenres(aw.medium, allGenres)
    const genreIds    = [...new Set([...subjectIds, ...mediumIds])]
    process.stdout.write(`${num} "${aw.title}" … `)

    try {
      const { key: primaryKey } = await uploadImage(aw.images[0])
      const { id: artworkId }   = await createArtwork({
        title: aw.title, medium: aw.medium, year: aw.year,
        imageKey: primaryKey, mediumTypeFieldId, mediumTypeValue: type,
        genres: genreIds,
      })
      for (let j = 1; j < aw.images.length; j++) {
        const { key: extraKey } = await uploadImage(aw.images[j])
        await addExtraImage(artworkId, extraKey, j)
      }
      console.log(`✓ id=${artworkId}`)
      succeeded++
    } catch (e) {
      console.log(`✗ FAILED: ${e.message}`)
      failed++
    }

    await new Promise(r => setTimeout(r, 250))
  }

  console.log(`\n── Done ──`)
  console.log(`✓ ${succeeded} artworks uploaded`)
  if (failed > 0) console.log(`✗ ${failed} failed — re-run to retry`)

  writeSkipReport(skipped, folder)
}

main().catch(e => { console.error(e); process.exit(1) })
