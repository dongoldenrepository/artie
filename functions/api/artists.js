// GET /api/artists  — returns the single artist for this subdomain
// PUT /api/artists  (admin — update artist settings)

export async function onRequestGet({ env, data }) {
  try {
    const artist = data.artist
    if (!artist) return Response.json({ artists: [] })
    const { admin_password, ...safe } = artist

    // ── Trial info ───────────────────────────────────────────────────────────
    let trialInfo = {}
    if (env.TRIAL_MODE === 'true') {
      const limit      = parseInt(env.TRIAL_LIMIT || '10')
      const { results } = await env.DB
        .prepare('SELECT COUNT(*) AS count FROM artworks WHERE artist_id = ?')
        .bind(artist.id)
        .all()
      const used = results[0]?.count ?? 0

      let daysLeft = null
      let expired  = false
      if (env.TRIAL_EXPIRES) {
        const expiry = new Date(env.TRIAL_EXPIRES + 'T23:59:59Z')
        daysLeft = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86_400_000))
        expired  = daysLeft === 0
      }

      trialInfo = {
        trial_mode:    true,
        trial_expires: env.TRIAL_EXPIRES || null,
        trial_limit:   limit,
        trial_used:    used,
        trial_days_left: daysLeft,
        trial_expired:   expired,
        trial_limit_hit: used >= limit,
      }
    }

    return Response.json({ artists: [{ ...safe, ...trialInfo }] })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestPut({ request, env, data }) {
  if (!data.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { default_medium, artist_type } = await request.json()
    const artistId = data.artistId
    await env.DB.prepare(
      'UPDATE artists SET default_medium=?, artist_type=COALESCE(?,artist_type) WHERE id=?'
    ).bind(default_medium ?? '', artist_type ?? null, artistId).run()
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
