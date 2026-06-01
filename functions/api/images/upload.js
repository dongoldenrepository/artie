// POST /api/images/upload  (admin only)
// Accepts multipart/form-data with field "image"
// Stores in R2, returns the key

function isAdmin(request, env) {
  return request.headers.get('X-Admin-Token') === env.ADMIN_PASSWORD
}

export async function onRequestPost({ env, request }) {
  if (!isAdmin(request, env)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const formData = await request.formData()
    const file = formData.get('image')
    if (!file) return Response.json({ error: 'No image provided' }, { status: 400 })

    // Build a unique key
    const ext = file.name.split('.').pop().toLowerCase() || 'jpg'
    const key = `artwork_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    // Upload to R2
    await env.IMAGES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || 'image/jpeg' },
    })

    return Response.json({ key, url: `/api/images/${key}`, success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
