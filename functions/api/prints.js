// POST /api/prints — create a print (admin)

export async function onRequestPost({ request, env }) {
  const token = request.headers.get('X-Admin-Token')
  if (token !== env.ADMIN_PASSWORD) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { artwork_id, size, medium, price, current_location, sold_to, is_available, notes } = await request.json()
    const result = await env.DB.prepare(`
      INSERT INTO prints (artwork_id, size, medium, price, current_location, sold_to, is_available, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(artwork_id, size||'', medium||'', price||null, current_location||'', sold_to||'', is_available??1, notes||'').run()
    return Response.json({ id: result.meta.last_row_id })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
