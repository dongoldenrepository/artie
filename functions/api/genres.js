// GET /api/genres?tag_type=subject&show_disabled=1
export async function onRequestGet({ env, request, data }) {
  try {
    const url = new URL(request.url)
    const artistId    = data.artistId
    const tagType     = url.searchParams.get('tag_type')
    const showDisabled = url.searchParams.get('show_disabled')

    let query = 'SELECT * FROM genres WHERE artist_id = ?'
    const params = [artistId]
    if (tagType)      { query += ' AND tag_type = ?'; params.push(tagType) }
    if (!showDisabled) { query += ' AND enabled = 1' }
    query += ' ORDER BY name'

    const result = await env.DB.prepare(query).bind(...params).all()
    return Response.json({ genres: result.results })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/genres  (admin only)
export async function onRequestPost({ env, request, data }) {
  if (!data.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { name, color = '#6b7280', tag_type = 'subject', enabled = 1 } = await request.json()
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 })
    if (!['medium', 'subject', 'style'].includes(tag_type))
      return Response.json({ error: 'tag_type must be medium, subject, or style' }, { status: 400 })

    const artistId = data.artistId
    const result = await env.DB.prepare(
      'INSERT INTO genres (artist_id, name, color, tag_type, enabled) VALUES (?,?,?,?,?)'
    ).bind(artistId, name.trim(), color, tag_type, enabled ? 1 : 0).run()
    return Response.json({ id: result.meta.last_row_id, name, color, tag_type, enabled: 1, success: true }, { status: 201 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
