// GET /api/categories
export async function onRequestGet({ env, data }) {
  try {
    const artistId = data.artistId
    const result = await env.DB.prepare(
      'SELECT * FROM categories WHERE artist_id = ? ORDER BY display_order, name'
    ).bind(artistId).all()
    return Response.json({ categories: result.results })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/categories  (admin only)
export async function onRequestPost({ env, request, data }) {
  if (!data.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { name, color = '#6b7280', is_printable = 0, display_order = 0 } = await request.json()
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

    const artistId = data.artistId
    const result = await env.DB.prepare(
      'INSERT INTO categories (artist_id, name, color, is_printable, display_order) VALUES (?,?,?,?,?)'
    ).bind(artistId, name.trim(), color, is_printable ? 1 : 0, display_order).run()

    return Response.json({
      id: result.meta.last_row_id, name, color, is_printable: is_printable ? 1 : 0, success: true
    }, { status: 201 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
