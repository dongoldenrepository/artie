// PUT /api/auth/viewer-pin
// Admin-only endpoint to update the artist's viewer PIN in the DB.
// Body: { pin: "1234" }

export async function onRequestPut({ request, env, data }) {
  if (!data.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { pin } = await request.json()
    if (!pin) return Response.json({ error: 'PIN is required' }, { status: 400 })
    if (pin.length < 4) return Response.json({ error: 'PIN must be at least 4 characters' }, { status: 400 })

    await env.DB
      .prepare('UPDATE artists SET viewer_pin = ? WHERE id = ?')
      .bind(pin, data.artistId)
      .run()

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 })
  }
}
