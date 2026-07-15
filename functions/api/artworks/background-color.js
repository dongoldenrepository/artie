// POST /api/artworks/background-color  (admin only)
// Body: { ids: [1,2,3], color: '#f5f0e6' | null }
//
// Bulk-applies one background color (or clears it, when color is null) to
// the *main* image of every artwork id given — the multiselect companion
// to the per-image picker in ArtworkDetail. Scoped to the current artist
// so a stray/forged id list can't touch another artist's catalog.

export async function onRequestPost({ env, request, data }) {
  if (!data.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { ids, color } = await request.json()
    if (!Array.isArray(ids) || !ids.length) {
      return Response.json({ error: 'ids is required' }, { status: 400 })
    }

    const artistId = data.artistId
    const placeholders = ids.map(() => '?').join(',')
    const stmt = env.DB.prepare(
      `UPDATE artworks SET background_color = ? WHERE id IN (${placeholders}) AND artist_id = ?`
    )
    await stmt.bind(color ?? null, ...ids, artistId).run()

    return Response.json({ success: true, count: ids.length })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
