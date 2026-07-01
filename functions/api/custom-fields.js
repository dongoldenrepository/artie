// GET /api/custom-fields
export async function onRequestGet({ env, data }) {
  try {
    const artistId = data.artistId
    const result = await env.DB.prepare(
      'SELECT * FROM custom_field_definitions WHERE artist_id = ? ORDER BY display_order, id'
    ).bind(artistId).all()
    const fields = result.results.map(f => ({
      ...f,
      field_options: f.field_options ? JSON.parse(f.field_options) : null,
    }))
    return Response.json({ fields })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/custom-fields  (admin only)
export async function onRequestPost({ env, request, data }) {
  if (!data.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { name, field_type = 'text', field_options = null, display_order = 0 } = await request.json()
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

    const artistId = data.artistId
    const optionsJson = field_options ? JSON.stringify(field_options) : null
    const result = await env.DB.prepare(
      'INSERT INTO custom_field_definitions (artist_id, name, field_type, field_options, display_order) VALUES (?,?,?,?,?)'
    ).bind(artistId, name.trim(), field_type, optionsJson, display_order).run()

    return Response.json({ id: result.meta.last_row_id, name, field_type, field_options, success: true }, { status: 201 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
