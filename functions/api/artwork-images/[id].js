// DELETE /api/artwork-images/:id   — remove an extra image (admin only)
// PATCH  /api/artwork-images/:id   — update sort_order or caption (admin only)

function isAdmin(request, env) {
  return request.headers.get('X-Admin-Token') === env.ADMIN_PASSWORD
}

export async function onRequestDelete({ env, request, params }) {
  if (!isAdmin(request, env)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(params.id)
  // Get image_key so we can delete from R2
  const row = await env.DB.prepare('SELECT image_key FROM artwork_images WHERE id = ?').bind(id).first()
  if (row) await env.IMAGES.delete(row.image_key)
  await env.DB.prepare('DELETE FROM artwork_images WHERE id = ?').bind(id).run()
  return Response.json({ success: true })
}

export async function onRequestPatch({ env, request, params }) {
  if (!isAdmin(request, env)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(params.id)
  const { caption, sort_order } = await request.json()
  await env.DB.prepare(
    'UPDATE artwork_images SET caption = COALESCE(?, caption), sort_order = COALESCE(?, sort_order) WHERE id = ?'
  ).bind(caption ?? null, sort_order ?? null, id).run()
  return Response.json({ success: true })
}
