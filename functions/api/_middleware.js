// Middleware: CORS headers for all /api/* routes

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
  'Access-Control-Max-Age': '86400',
}

export async function onRequest(context) {
  const { request, next } = context

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  // Run the handler
  const response = await next()

  // Attach CORS headers to every response
  const newResponse = new Response(response.body, response)
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    newResponse.headers.set(k, v)
  }
  return newResponse
}

// Helper exported for use in route handlers
export function isAdmin(request, env) {
  const token = request.headers.get('X-Admin-Token')
  return token && token === env.ADMIN_PASSWORD
}
