// POST /api/artworks/reorder  (admin only)
// Body: { order: [{id, sort_order}] }

export async function onRequestPost({ env, request, data }) {
  if (!data.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { order } = await request.json()
    if (!Array.isArray(order) || !order.length) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const stmt = env.DB.prepare('UPDATE artworks SET sort_order = ? WHERE id = ?')
    await env.DB.batch(order.map(({ id, sort_order }) => stmt.bind(sort_order, id)))
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
