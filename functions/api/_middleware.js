// Middleware: CORS headers + pre-computed admin status for all /api/* routes
import { checkAdmin } from './_auth.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
  'Access-Control-Max-Age': '86400',
}

export async function onRequest(context) {
  const { request, next, env } = context

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  // Pre-compute admin status so route handlers don't each repeat the DB lookup
  context.data.isAdmin = await checkAdmin(request, env)

  // Run the handler
  const response = await next()

  // Attach CORS headers to every response
  const newResponse = new Response(response.body, response)
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    newResponse.headers.set(k, v)
  }
  return newResponse
}
