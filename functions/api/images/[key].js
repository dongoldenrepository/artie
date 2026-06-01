// GET /api/images/:key  — serve image from R2

export async function onRequestGet({ env, params }) {
  try {
    const key = params.key
    const object = await env.IMAGES.get(key)

    if (!object) {
      return new Response('Image not found', { status: 404 })
    }

    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    headers.set('ETag', object.httpEtag)

    return new Response(object.body, { headers })
  } catch (e) {
    return new Response('Error fetching image', { status: 500 })
  }
}
