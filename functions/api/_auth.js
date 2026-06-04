// Shared auth utilities
// Password stored as "salt:hash" in artists.admin_password

async function computeHash(password, salt) {
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashPassword(password) {
  const salt = crypto.randomUUID()
  const hash = await computeHash(password, salt)
  return `${salt}:${hash}`
}

export async function verifyPassword(password, stored) {
  const colonIdx = stored.indexOf(':')
  if (colonIdx === -1) return false
  const salt = stored.slice(0, colonIdx)
  const hash = stored.slice(colonIdx + 1)
  const computed = await computeHash(password, salt)
  return computed === hash
}

// Returns true if the token grants admin access.
// artist: the resolved artist row (from context.data.artist)
// Priority: master password > artist DB password > env.ADMIN_PASSWORD fallback
export async function checkAdmin(request, env, artist) {
  const token = request.headers.get('X-Admin-Token')
  if (!token) return false

  // Master password always works for any artist
  if (env.MASTER_PASSWORD && token === env.MASTER_PASSWORD) return true

  if (artist?.admin_password) {
    // Artist has set a personal password — only DB password (or master) works
    return await verifyPassword(token, artist.admin_password)
  }

  // No DB password set yet — fall back to env.ADMIN_PASSWORD
  return token === env.ADMIN_PASSWORD
}
