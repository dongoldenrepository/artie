// GET /api/artworks/:id  — full detail with showings, custom fields
export async function onRequestGet({ env, params, data }) {
  try {
    const id = Number(params.id)

    const artwork = await env.DB.prepare(`
      SELECT a.*, ar.name AS artist_name, ar.artist_type,
             c.name AS category_name, c.color AS category_color, c.is_printable
      FROM artworks a
      LEFT JOIN artists ar ON a.artist_id = ar.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `).bind(id).first()

    if (!artwork) return Response.json({ error: 'Not found' }, { status: 404 })

    // Genres (style tags)
    const genresRes = await env.DB.prepare(`
      SELECT g.id, g.name, g.color, g.tag_type
      FROM artwork_genres ag
      JOIN genres g ON ag.category_id = g.id
      WHERE ag.artwork_id = ?
    `).bind(id).all()

    // Showings
    const showings = await env.DB.prepare(
      'SELECT * FROM showings WHERE artwork_id = ? ORDER BY start_date DESC'
    ).bind(id).all()

    // Custom field values
    const customVals = await env.DB.prepare(`
      SELECT cfd.id AS field_id, cfd.name AS field_name, cfd.field_type, cfd.field_options, acv.value
      FROM custom_field_definitions cfd
      LEFT JOIN artwork_custom_values acv ON acv.field_id = cfd.id AND acv.artwork_id = ?
      WHERE cfd.artist_id = ?
      ORDER BY cfd.display_order, cfd.id
    `).bind(id, artwork.artist_id).all()
    const customFields = customVals.results.map(f => ({
      ...f,
      field_options: f.field_options ? JSON.parse(f.field_options) : null,
    }))

    // Prints
    const prints = await env.DB.prepare(
      'SELECT * FROM prints WHERE artwork_id = ? ORDER BY created_at DESC'
    ).bind(id).all()

    // Extra images
    const extraImages = await env.DB.prepare(
      'SELECT * FROM artwork_images WHERE artwork_id = ? ORDER BY sort_order, id'
    ).bind(id).all()

    return Response.json({
      ...artwork,
      genres: genresRes.results,
      showings: showings.results,
      custom_fields: customFields,
      prints: prints.results,
      extra_images: extraImages.results,
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// PUT /api/artworks/:id  (admin only)
export async function onRequestPut({ env, request, params, data }) {
  if (!data.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const id = Number(params.id)
    const {
      title, medium, size, price, date_created,
      current_location, description, image_key, is_available,
      category_id, background_color,
      genres, custom_values,
      showings
    } = await request.json()

    // Build dynamic UPDATE
    const fields = []
    const vals = []
    const map = { title, medium, size, price, date_created, current_location, description, image_key, is_available, category_id, background_color }
    for (const [k, v] of Object.entries(map)) {
      if (v !== undefined) { fields.push(`${k} = ?`); vals.push(v ?? null) }
    }

    if (fields.length) {
      vals.push(id)
      await env.DB.prepare(`UPDATE artworks SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run()
    }

    // Update genres (style tags)
    if (genres !== undefined) {
      await env.DB.prepare('DELETE FROM artwork_genres WHERE artwork_id = ?').bind(id).run()
      for (const genreId of genres) {
        await env.DB.prepare(
          'INSERT OR IGNORE INTO artwork_genres (artwork_id, category_id) VALUES (?,?)'
        ).bind(id, genreId).run()
      }
    }

    // Update custom field values
    if (custom_values) {
      for (const [fieldId, value] of Object.entries(custom_values)) {
        if (value === null || value === '') {
          await env.DB.prepare(
            'DELETE FROM artwork_custom_values WHERE artwork_id = ? AND field_id = ?'
          ).bind(id, Number(fieldId)).run()
        } else {
          await env.DB.prepare(
            'INSERT OR REPLACE INTO artwork_custom_values (artwork_id, field_id, value) VALUES (?,?,?)'
          ).bind(id, Number(fieldId), String(value)).run()
        }
      }
    }

    // Replace showings
    if (showings !== undefined) {
      await env.DB.prepare('DELETE FROM showings WHERE artwork_id = ?').bind(id).run()
      for (const s of showings) {
        await env.DB.prepare(
          'INSERT INTO showings (artwork_id, venue, location, start_date, end_date, notes) VALUES (?,?,?,?,?,?)'
        ).bind(id, s.venue, s.location || null, s.start_date || null, s.end_date || null, s.notes || null).run()
      }
    }

    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/artworks/:id  (admin only)
export async function onRequestDelete({ env, request, params, data }) {
  if (!data.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const id = Number(params.id)

    // Get image key to delete from R2
    const row = await env.DB.prepare('SELECT image_key FROM artworks WHERE id = ?').bind(id).first()

    // Delete from DB (cascades to genres, showings, custom values)
    await env.DB.prepare('DELETE FROM artworks WHERE id = ?').bind(id).run()

    // Delete image from R2 only if no other artwork shares the same key
    if (row?.image_key && env.IMAGES) {
      const stillUsed = await env.DB
        .prepare('SELECT COUNT(*) AS n FROM artworks WHERE image_key = ?')
        .bind(row.image_key).first()
      if (!stillUsed?.n) {
        await env.IMAGES.delete(row.image_key).catch(() => {})
      }
    }

    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
