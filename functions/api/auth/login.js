// POST /api/auth/login
import { verifyPassword } from '../_auth.js'

export async function onRequestPost({ request, env, data }) {
  try {
    const { password } = await request.json()
    if (!password) return Response.json({ error: 'Password required' }, { status: 400 })

    const artist = data.artist

    // Master password — always works, no forced change
    if (env.MASTER_PASSWORD && password === env.MASTER_PASSWORD) {
      return Response.json({ token: password, success: true, isMaster: true })
    }

    if (artist?.admin_password) {
      // Artist has set a personal password
      const valid = await verifyPassword(password, artist.admin_password)
      if (!valid) return Response.json({ error: 'Invalid password' }, { status: 401 })
      return Response.json({ token: password, success: true })
    }

    // No DB password yet — fall back to env.ADMIN_PASSWORD
    if (password !== env.ADMIN_PASSWORD) {
      return Response.json({ error: 'Invalid password' }, { status: 401 })
    }

    // First login with env password — require them to set a personal one
    return Response.json({ token: password, success: true, mustChangePassword: true })

  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 })
  }
}
