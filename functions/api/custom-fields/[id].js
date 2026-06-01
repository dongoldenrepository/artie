function isAdmin(request, env) {
  return request.headers.get('X-Admin-Token') === env.ADMIN_PASSWORD
}

// DELETE /api/custom-fields/:id
export async function onRequestDelete({ env, request, params }) {
  if (!isAdmin(request, env)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await env.DB.prepare('DELETE FROM custom_field_definitions WHERE id = ?').bind(Number(params.id)).run()
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
