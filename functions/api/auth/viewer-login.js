// POST /api/auth/viewer-login
// Validates the viewer PIN. Checks in order:
//   1. artists.viewer_pin in DB (artist-set custom PIN)
//   2. VIEWER_PASSWORD env var (provisioned default)
//   3. MASTER_VIEWER_PASSWORD env var (owner bypass — always works)
// Returns { success: true, token } on success, 401 on failure.

export async function onRequestPost({ request, env, data }) {
  try {
    const { pin } = await request.json()

    const masterPin = env.MASTER_VIEWER_PASSWORD
    const envPin    = env.VIEWER_PASSWORD
    const dbPin     = data.artist?.viewer_pin ?? null

    // No PIN configured anywhere — site is open
    if (!masterPin && !envPin && !dbPin) {
      return Response.json({ success: true, token: 'open' })
    }

    // Empty PIN submitted — reject unless site is open
    if (!pin) return Response.json({ error: 'PIN required' }, { status: 400 })

    // Master bypass always works
    if (masterPin && pin === masterPin) {
      return Response.json({ success: true, token: pin })
    }

    // DB pin takes precedence over env pin
    const activePin = dbPin ?? envPin
    if (activePin && pin === activePin) {
      return Response.json({ success: true, token: pin })
    }

    return Response.json({ error: 'Incorrect PIN' }, { status: 401 })
  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 })
  }
}
