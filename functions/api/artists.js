// GET /api/artists  — returns the single artist for this subdomain
// PUT /api/artists  (admin — update artist settings)

export async function onRequestGet({ env, data }) {
  try {
    // In multi-tenant, return just the resolved artist as an array for frontend compatibility
    const artist = data.artist
    if (!artist) return Response.json({ artists: [] })
    const { admin_password, ...safe } = artist
    return Response.json({ artists: [safe] })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestPut({ request, env, data }) {
  if (!data.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { default_medium, artist_type } = await request.json()
    const artistId = data.artistId
    await env.DB.prepare(
      'UPDATE artists SET default_medium=?, artist_type=COALESCE(?,artist_type) WHERE id=?'
    ).bind(default_medium ?? '', artist_type ?? null, artistId).run()
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
