// DELETE /api/artwork-images/:id   — remove an extra image (admin only)
// PATCH  /api/artwork-images/:id   — update sort_order or caption (admin only)

export async function onRequestDelete({ env, request, params, data }) {
  if (!data.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(params.id)
  // Get image_key so we can delete from R2
  const row = await env.DB.prepare('SELECT image_key FROM artwork_images WHERE id = ?').bind(id).first()
  if (row) await env.IMAGES.delete(row.image_key)
  await env.DB.prepare('DELETE FROM artwork_images WHERE id = ?').bind(id).run()
  return Response.json({ success: true })
}

export async function onRequestPatch({ env, request, params, data }) {
  if (!data.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(params.id)
  const body = await request.json()
  const { caption, sort_order } = body

  // background_color needs to support being explicitly cleared back to
  // null (revert to the default checkerboard), so it can't share the
  // COALESCE-if-provided pattern used for caption/sort_order above —
  // only touch it if the key was actually present in the request body.
  if ('background_color' in body) {
    await env.DB.prepare(
      'UPDATE artwork_images SET caption = COALESCE(?, caption), sort_order = COALESCE(?, sort_order), background_color = ? WHERE id = ?'
    ).bind(caption ?? null, sort_order ?? null, body.background_color ?? null, id).run()
  } else {
    await env.DB.prepare(
      'UPDATE artwork_images SET caption = COALESCE(?, caption), sort_order = COALESCE(?, sort_order) WHERE id = ?'
    ).bind(caption ?? null, sort_order ?? null, id).run()
  }
  return Response.json({ success: true })
}
