function isAdmin(request, env) {
  return request.headers.get('X-Admin-Token') === env.ADMIN_PASSWORD
}

// PUT /api/categories/:id
export async function onRequestPut({ env, request, params }) {
  if (!isAdmin(request, env)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { name, color, is_printable, display_order } = await request.json()
    const fields = []
    const vals = []
    if (name !== undefined)         { fields.push('name = ?');          vals.push(name) }
    if (color !== undefined)        { fields.push('color = ?');         vals.push(color) }
    if (is_printable !== undefined) { fields.push('is_printable = ?');  vals.push(is_printable ? 1 : 0) }
    if (display_order !== undefined){ fields.push('display_order = ?'); vals.push(display_order) }
    if (!fields.length) return Response.json({ error: 'Nothing to update' }, { status: 400 })
    vals.push(Number(params.id))
    await env.DB.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run()
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/categories/:id
export async function onRequestDelete({ env, request, params }) {
  if (!isAdmin(request, env)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    // Null out artwork category_id references before deleting
    await env.DB.prepare('UPDATE artworks SET category_id = NULL WHERE category_id = ?').bind(Number(params.id)).run()
    await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(Number(params.id)).run()
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
