// GET /api/images/:key  — serve image from R2
// Uses [[key]] catch-all to support keys with slashes (e.g. "don/image.jpg")

export async function onRequestGet({ env, params }) {
  try {
    // params.key is an array of path segments — join to reconstruct the full key
    const key = Array.isArray(params.key) ? params.key.join('/') : params.key
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
