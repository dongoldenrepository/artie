// GET /api/artworks?genre_id=2&search=...
export async function onRequestGet({ env, request, data }) {
  try {
    const url = new URL(request.url)
    const artistId  = data.artistId
    const genreId   = url.searchParams.get('genre_id')
    const categoryId = url.searchParams.get('category_id')
    const search      = url.searchParams.get('search')
    const searchScope = url.searchParams.get('search_scope') || 'title'
    const terms       = search ? search.trim().split(/\s+/).filter(Boolean) : []

    let query = `
      SELECT
        a.id, a.artist_id, a.title, a.medium, a.size, a.price,
        a.date_created, a.current_location, a.description,
        a.image_key, a.is_available, a.artwork_type, a.sort_order, a.created_at, a.updated_at,
        a.category_id,
        ar.name AS artist_name, ar.artist_type,
        c.name AS category_name, c.color AS category_color, c.is_printable,
        GROUP_CONCAT(g.id   || '~~' || g.name || '~~' || g.color || '~~' || COALESCE(g.tag_type,'subject'), '||') AS genres_raw,
        (SELECT COUNT(*) FROM prints p WHERE p.artwork_id = a.id) AS print_count,
        (SELECT COUNT(*) FROM prints p WHERE p.artwork_id = a.id AND p.is_available = 1) AS prints_available
      FROM artworks a
      LEFT JOIN artists ar ON a.artist_id = ar.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN artwork_genres ag ON a.id = ag.artwork_id
      LEFT JOIN genres g ON ag.category_id = g.id
      WHERE a.artist_id = ?`
    const params = [artistId]

    if (categoryId) { query += ' AND a.category_id = ?'; params.push(Number(categoryId)) }
    for (const term of terms) {
      const p = `%${term}%`
      if (searchScope === 'all') {
        query += ` AND (
          a.title LIKE ? OR a.medium LIKE ? OR a.description LIKE ?
          OR EXISTS (SELECT 1 FROM showings sh WHERE sh.artwork_id = a.id
                     AND (sh.venue LIKE ? OR sh.location LIKE ? OR sh.notes LIKE ?))
        )`
        params.push(p, p, p, p, p, p)
      } else {
        query += ' AND a.title LIKE ?'
        params.push(p)
      }
    }

    query += ' GROUP BY a.id ORDER BY a.sort_order DESC, a.created_at DESC'

    const result = await env.DB.prepare(query).bind(...params).all()

    let artworks = result.results.map(row => {
      const genres = row.genres_raw
        ? row.genres_raw.split('||').map(g => {
            const [id, name, color, tag_type] = g.split('~~')
            return { id: Number(id), name, color, tag_type: tag_type || 'subject' }
          })
        : []
      const { genres_raw, ...rest } = row
      return { ...rest, genres }
    })

    // Filter by genre after join (avoids complex SQL)
    if (genreId) {
      artworks = artworks.filter(a => a.genres.some(g => g.id === Number(genreId)))
    }

    return Response.json({ artworks })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/artworks  (admin only)
export async function onRequestPost({ env, request, data }) {
  if (!data.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Trial mode enforcement ─────────────────────────────────────────────────
  if (env.TRIAL_MODE === 'true') {
    // Check expiry
    if (env.TRIAL_EXPIRES) {
      const expires = new Date(env.TRIAL_EXPIRES + 'T23:59:59Z')
      if (Date.now() > expires.getTime()) {
        return Response.json({
          error: 'trial_expired',
          message: 'Your free trial has ended. Contact us to activate your full account.',
        }, { status: 403 })
      }
    }
    // Check piece count
    const limit = parseInt(env.TRIAL_LIMIT || '10')
    const { results } = await env.DB
      .prepare('SELECT COUNT(*) AS count FROM artworks WHERE artist_id = ?')
      .bind(data.artistId)
      .all()
    const used = results[0]?.count ?? 0
    if (used >= limit) {
      return Response.json({
        error: 'trial_limit',
        message: `Trial limit of ${limit} pieces reached. Contact us to upgrade.`,
      }, { status: 403 })
    }
  }

  try {
    const {
      title, medium, size, price, date_created,
      current_location, description, image_key,
      is_available = 1,
      artwork_type = 'artwork',
      category_id = null,
      genres = [], custom_values = {}
    } = await request.json()

    if (!title) return Response.json({ error: 'title is required' }, { status: 400 })

    const artistId = data.artistId

    const ins = await env.DB.prepare(`
      INSERT INTO artworks
        (artist_id, title, medium, size, price, date_created, current_location, description, image_key, is_available, artwork_type, category_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      artistId, title, medium || null, size || null,
      price ?? null, date_created || null,
      current_location || null, description || null,
      image_key || null, is_available, artwork_type,
      category_id || null
    ).run()

    const artworkId = ins.meta.last_row_id

    // Genres (style tags)
    for (const genreId of genres) {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO artwork_genres (artwork_id, category_id) VALUES (?,?)'
      ).bind(artworkId, genreId).run()
    }

    // Custom field values
    for (const [fieldId, value] of Object.entries(custom_values)) {
      if (value !== undefined && value !== '') {
        await env.DB.prepare(
          'INSERT OR REPLACE INTO artwork_custom_values (artwork_id, field_id, value) VALUES (?,?,?)'
        ).bind(artworkId, Number(fieldId), String(value)).run()
      }
    }

    return Response.json({ id: artworkId, success: true }, { status: 201 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
