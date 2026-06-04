// GET /api/categories?artist_id=1
export async function onRequestGet({ env, request, data }) {
  try {
    const url = new URL(request.url)
    const artistId = url.searchParams.get('artist_id')

    let query = 'SELECT * FROM categories'
    const params = []
    if (artistId) { query += ' WHERE artist_id = ?'; params.push(Number(artistId)) }
    query += ' ORDER BY display_order, name'

    const result = await env.DB.prepare(query).bind(...params).all()
    return Response.json({ categories: result.results })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/categories  (admin only)
export async function onRequestPost({ env, request, data }) {
  if (!data.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { name, color = '#6b7280', artist_id = 1, is_printable = 0, display_order = 0 } = await request.json()
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

    const result = await env.DB.prepare(
      'INSERT INTO categories (artist_id, name, color, is_printable, display_order) VALUES (?,?,?,?,?)'
    ).bind(artist_id, name.trim(), color, is_printable ? 1 : 0, display_order).run()

    return Response.json({
      id: result.meta.last_row_id, name, color, is_printable: is_printable ? 1 : 0, success: true
    }, { status: 201 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
