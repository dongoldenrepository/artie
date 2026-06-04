// Middleware: CORS headers + artist resolution + admin auth for all /api/* routes
import { checkAdmin } from './_auth.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
  'Access-Control-Max-Age': '86400',
}

// Extract subdomain from host header.
// "don.artie-site.com"        → "don"
// "don.artie-kathy.pages.dev" → "don"  (future)
// "artie-don.pages.dev"       → null   (legacy single-artist deployment)
// "localhost"                 → null   (local dev — fall back to first artist)
function extractSubdomain(host) {
  if (!host) return null
  // Strip port if present
  const hostname = host.split(':')[0]
  const parts = hostname.split('.')
  // Need at least 3 parts for a subdomain (sub.domain.tld)
  if (parts.length < 3) return null
  const sub = parts[0]
  // Ignore 'www'
  if (sub === 'www') return null
  return sub
}

export async function onRequest(context) {
  const { request, next, env } = context

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  // ── Artist resolution ──────────────────────────────────────────────────────
  const host = request.headers.get('host') || ''
  const subdomain = extractSubdomain(host)

  let artist = null
  if (subdomain) {
    artist = await env.DB
      .prepare('SELECT * FROM artists WHERE subdomain = ?')
      .bind(subdomain)
      .first()
  }

  // Fall back to first artist (legacy single-artist deployments + local dev)
  if (!artist) {
    artist = await env.DB
      .prepare('SELECT * FROM artists ORDER BY id LIMIT 1')
      .first()
  }

  context.data.artist   = artist
  context.data.artistId = artist?.id ?? 1

  // ── Admin auth ─────────────────────────────────────────────────────────────
  context.data.isAdmin = await checkAdmin(request, env, artist)

  // Run the handler
  const response = await next()

  // Attach CORS headers to every response
  const newResponse = new Response(response.body, response)
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    newResponse.headers.set(k, v)
  }
  return newResponse
}
