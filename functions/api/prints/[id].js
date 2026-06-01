// PUT /api/prints/:id — update a print (admin)
// DELETE /api/prints/:id — delete a print (admin)

function auth(request, env) {
  return request.headers.get('X-Admin-Token') === env.ADMIN_PASSWORD
}

export async function onRequestPut({ request, env, params }) {
  if (!auth(request, env)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { size, medium, price, current_location, sold_to, is_available, notes } = await request.json()
    await env.DB.prepare(`
      UPDATE prints SET size=?, medium=?, price=?, current_location=?, sold_to=?, is_available=?, notes=?
      WHERE id=?
    `).bind(size||'', medium||'', price||null, current_location||'', sold_to||'', is_available??1, notes||'', params.id).run()
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestDelete({ request, env, params }) {
  if (!auth(request, env)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await env.DB.prepare('DELETE FROM prints WHERE id=?').bind(params.id).run()
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
