// PUT /api/genres/:id
export async function onRequestPut({ env, request, params, data }) {
  if (!data.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { name, color, enabled } = await request.json()
    const fields = []
    const vals = []
    if (name !== undefined)    { fields.push('name = ?');    vals.push(name) }
    if (color !== undefined)   { fields.push('color = ?');   vals.push(color) }
    if (enabled !== undefined) { fields.push('enabled = ?'); vals.push(enabled ? 1 : 0) }
    if (!fields.length) return Response.json({ error: 'Nothing to update' }, { status: 400 })
    vals.push(Number(params.id))
    await env.DB.prepare(`UPDATE genres SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run()
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/genres/:id
export async function onRequestDelete({ env, request, params, data }) {
  if (!data.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await env.DB.prepare('DELETE FROM genres WHERE id = ?').bind(Number(params.id)).run()
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
