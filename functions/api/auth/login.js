// POST /api/auth/login
// Returns a token (the admin password) that the client stores in sessionStorage.
// Simple but sufficient for link-sharing / beta access model.

export async function onRequestPost({ request, env }) {
  try {
    const { password } = await request.json()
    if (!password || password !== env.ADMIN_PASSWORD) {
      return Response.json({ error: 'Invalid password' }, { status: 401 })
    }
    return Response.json({ token: env.ADMIN_PASSWORD, success: true })
  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 })
  }
}
