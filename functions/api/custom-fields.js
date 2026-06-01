function isAdmin(request, env) {
  return request.headers.get('X-Admin-Token') === env.ADMIN_PASSWORD
}

// GET /api/custom-fields?artist_id=1
export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url)
    const artistId = url.searchParams.get('artist_id') || '1'
    const result = await env.DB.prepare(
      'SELECT * FROM custom_field_definitions WHERE artist_id = ? ORDER BY display_order, id'
    ).bind(Number(artistId)).all()
    return Response.json({ fields: result.results })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/custom-fields  (admin only)
export async function onRequestPost({ env, request }) {
  if (!isAdmin(request, env)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { name, field_type = 'text', display_order = 0, artist_id = 1 } = await request.json()
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

    const result = await env.DB.prepare(
      'INSERT INTO custom_field_definitions (artist_id, name, field_type, display_order) VALUES (?,?,?,?)'
    ).bind(artist_id, name.trim(), field_type, display_order).run()

    return Response.json({ id: result.meta.last_row_id, name, field_type, success: true }, { status: 201 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
