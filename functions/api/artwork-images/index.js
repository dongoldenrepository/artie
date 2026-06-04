// GET  /api/artwork-images?artwork_id=X  — list extra images for an artwork
// POST /api/artwork-images               — add an image (admin only)

export async function onRequestGet({ env, request, data }) {
  const url = new URL(request.url)
  const artworkId = Number(url.searchParams.get('artwork_id'))
  if (!artworkId) return Response.json({ images: [] })
  const res = await env.DB.prepare(
    'SELECT * FROM artwork_images WHERE artwork_id = ? ORDER BY sort_order, id'
  ).bind(artworkId).all()
  return Response.json({ images: res.results })
}

export async function onRequestPost({ env, request, data }) {
  if (!data.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { artwork_id, image_key, caption, sort_order = 0 } = await request.json()
  if (!artwork_id || !image_key) return Response.json({ error: 'artwork_id and image_key required' }, { status: 400 })
  const res = await env.DB.prepare(
    'INSERT INTO artwork_images (artwork_id, image_key, caption, sort_order) VALUES (?,?,?,?)'
  ).bind(artwork_id, image_key, caption || null, sort_order).run()
  return Response.json({ id: res.meta.last_row_id, success: true }, { status: 201 })
}
