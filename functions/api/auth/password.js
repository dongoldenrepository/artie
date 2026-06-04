// PUT /api/auth/password — change admin password
import { hashPassword } from '../_auth.js'

export async function onRequestPut({ request, env, data }) {
  try {
    const { newPassword } = await request.json()

    if (!newPassword) {
      return Response.json({ error: 'New password is required' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }

    // Verify current password via middleware-computed isAdmin
    if (!data.isAdmin) {
      return Response.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const artistId = data.artistId

    // Hash and store new password
    const hashed = await hashPassword(newPassword)
    await env.DB
      .prepare('UPDATE artists SET admin_password = ? WHERE id = ?')
      .bind(hashed, artistId)
      .run()

    return Response.json({ success: true, token: newPassword })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
