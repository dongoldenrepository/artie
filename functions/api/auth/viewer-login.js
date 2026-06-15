// POST /api/auth/viewer-login
// Validates the viewer PIN against VIEWER_PASSWORD or MASTER_VIEWER_PASSWORD env vars.
// Returns { success: true, token } on success, 401 on failure.

export async function onRequestPost({ request, env }) {
  try {
    const { pin } = await request.json()
    if (!pin) return Response.json({ error: 'PIN required' }, { status: 400 })

    const viewerPassword   = env.VIEWER_PASSWORD
    const masterPassword   = env.MASTER_VIEWER_PASSWORD

    if (!viewerPassword && !masterPassword) {
      // No viewer PIN configured — allow access (open site)
      return Response.json({ success: true, token: 'open' })
    }

    if ((masterPassword && pin === masterPassword) ||
        (viewerPassword && pin === viewerPassword)) {
      return Response.json({ success: true, token: pin })
    }

    return Response.json({ error: 'Incorrect PIN' }, { status: 401 })
  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 })
  }
}
