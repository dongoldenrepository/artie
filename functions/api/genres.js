function isAdmin(request, env) {
  return request.headers.get('X-Admin-Token') === env.ADMIN_PASSWORD
}

// GET /api/genres?artist_id=1&tag_type=subject&show_disabled=1
export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url)
    const artistId    = url.searchParams.get('artist_id')
    const tagType     = url.searchParams.get('tag_type')      // 'medium' | 'subject' | 'style' | omit for all
    const showDisabled = url.searchParams.get('show_disabled') // '1' to include disabled tags

    let query = 'SELECT * FROM genres WHERE 1=1'
    const params = []
    if (artistId)    { query += ' AND artist_id = ?'; params.push(Number(artistId)) }
    if (tagType)     { query += ' AND tag_type = ?';  params.push(tagType) }
    if (!showDisabled) { query += ' AND enabled = 1' }
    query += ' ORDER BY name'

    const result = await env.DB.prepare(query).bind(...params).all()
    return Response.json({ genres: result.results })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/genres  (admin only)
export async function onRequestPost({ env, request }) {
  if (!isAdmin(request, env)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { name, color = '#6b7280', artist_id = 1, tag_type = 'subject', enabled = 1 } = await request.json()
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 })
    if (!['medium', 'subject', 'style'].includes(tag_type))
      return Response.json({ error: 'tag_type must be medium, subject, or style' }, { status: 400 })

    const result = await env.DB.prepare(
      'INSERT INTO genres (artist_id, name, color, tag_type, enabled) VALUES (?,?,?,?,?)'
    ).bind(artist_id, name.trim(), color, tag_type, enabled ? 1 : 0).run()
    return Response.json({ id: result.meta.last_row_id, name, color, tag_type, enabled: 1, success: true }, { status: 201 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
