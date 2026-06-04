// PUT /api/auth/password — change admin password
import { verifyPassword, hashPassword } from '../_auth.js'

export async function onRequestPut({ request, env, data }) {
  try {
    const { currentPassword, newPassword } = await request.json()
    if (!currentPassword || !newPassword) {
      return Response.json({ error: 'Both current and new password are required' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }

    // Verify current password (reuse middleware-computed check)
    if (!data.isAdmin) {
      return Response.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    // Hash and store new password
    const hashed = await hashPassword(newPassword)
    await env.DB
      .prepare('UPDATE artists SET admin_password = ? WHERE id = (SELECT MIN(id) FROM artists)')
      .bind(hashed)
      .run()

    return Response.json({ success: true, token: newPassword })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
