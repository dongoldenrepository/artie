// GET /api/artists
// PUT /api/artists  (admin — update artist settings)

export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(
      'SELECT id, name, email, bio, website, default_medium, artist_type, created_at FROM artists ORDER BY id'
    ).all()
    return Response.json({ artists: result.results })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestPut({ request, env }) {
  const token = request.headers.get('X-Admin-Token')
  if (token !== env.ADMIN_PASSWORD) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, default_medium, artist_type } = await request.json()
    await env.DB.prepare(
      'UPDATE artists SET default_medium=?, artist_type=COALESCE(?,artist_type) WHERE id=?'
    ).bind(default_medium ?? '', artist_type ?? null, id).run()
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
