const BASE = '/api'

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export const api = {
  // Artworks
  getArtworks: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return req(`/artworks${q ? '?' + q : ''}`)
  },
  getArtwork: (id) => req(`/artworks/${id}`),
  createArtwork: (data, token) => req('/artworks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify(data),
  }),
  updateArtwork: (id, data, token) => req(`/artworks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify(data),
  }),
  deleteArtwork: (id, token) => req(`/artworks/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Token': token },
  }),

  // Categories (medium types: 2D Art, Photography, Ceramics…)
  getCategories: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return req(`/categories${q ? '?' + q : ''}`)
  },
  createCategory: (data, token) => req('/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify(data),
  }),
  updateCategory: (id, data, token) => req(`/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify(data),
  }),
  deleteCategory: (id, token) => req(`/categories/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Token': token },
  }),

  // Genres (medium / subject / style tags)
  getGenres: () => req('/genres'),
  getAllGenres: () => req('/genres?show_disabled=1'),
  createGenre: (data, token) => req('/genres', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify(data),
  }),
  updateGenre: (id, data, token) => req(`/genres/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify(data),
  }),
  toggleGenre: (id, enabled, token) => req(`/genres/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify({ enabled: enabled ? 1 : 0 }),
  }),
  deleteGenre: (id, token) => req(`/genres/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Token': token },
  }),

  // Custom fields
  getCustomFields: () => req('/custom-fields'),
  createCustomField: (data, token) => req('/custom-fields', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify(data),
  }),
  deleteCustomField: (id, token) => req(`/custom-fields/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Token': token },
  }),

  // Artists
  getArtists: () => req('/artists'),
  updateArtist: (data, token) => req('/artists', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify(data),
  }),

  // Prints
  createPrint: (data, token) => req('/prints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify(data),
  }),
  updatePrint: (id, data, token) => req(`/prints/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify(data),
  }),
  deletePrint: (id, token) => req(`/prints/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Token': token },
  }),

  // Artwork extra images
  getArtworkImages: (artworkId) => req(`/artwork-images?artwork_id=${artworkId}`),
  addArtworkImage: (data, token) => req('/artwork-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify(data),
  }),
  deleteArtworkImage: (id, token) => req(`/artwork-images/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Token': token },
  }),
  updateArtworkImage: (id, data, token) => req(`/artwork-images/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify(data),
  }),

  // Auth
  login: (password) => req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  }),
  changePassword: (currentPassword, newPassword) => req('/auth/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': currentPassword },
    body: JSON.stringify({ currentPassword, newPassword }),
  }),

  // Reorder artworks (manual sort)
  reorderArtworks: (order, token) => req('/artworks/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify({ order }),
  }),

  // Bulk-apply a background color to many artworks at once (thumbnail multiselect)
  bulkSetBackgroundColor: (ids, color, token) => req('/artworks/background-color', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify({ ids, color }),
  }),

  // Image upload — resizes to 2000px long side if needed before uploading.
  // Alpha-aware: PNG/WebP/GIF sources are only re-encoded as JPEG if they
  // turn out to be fully opaque. If any pixel is transparent, we re-encode
  // as PNG instead — flattening a transparent image to JPEG silently bakes
  // a solid black background into the file, permanently.
  uploadImage: async (file, token) => {
    const MAX_LONG_SIDE = 2000
    const JPEG_QUALITY = 0.90

    const resizedFile = await new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const { naturalWidth: w, naturalHeight: h } = img
        const longSide = Math.max(w, h)
        if (longSide <= MAX_LONG_SIDE) {
          resolve(file)
          return
        }
        const scale = MAX_LONG_SIDE / longSide
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(w * scale)
        canvas.height = Math.round(h * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // JPEG sources never have an alpha channel, so they're always safe
        // to re-encode as JPEG. PNG/WebP/GIF *might* be transparent — check
        // actual pixel data before deciding.
        const canHaveAlpha = file.type !== 'image/jpeg' && file.type !== 'image/jpg'
        let isTransparent = false
        if (canHaveAlpha) {
          const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) { isTransparent = true; break }
          }
        }

        if (isTransparent) {
          canvas.toBlob(
            (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' })),
            'image/png'
          )
        } else {
          canvas.toBlob(
            (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
            'image/jpeg',
            JPEG_QUALITY
          )
        }
      }
      img.src = url
    })

    const fd = new FormData()
    fd.append('image', resizedFile)
    const res = await fetch(`${BASE}/images/upload`, {
      method: 'POST',
      headers: { 'X-Admin-Token': token },
      body: fd,
    })
    if (!res.ok) throw new Error('Image upload failed')
    return res.json()
  },
}

export function imgSrc(key) {
  if (!key) return null
  if (key.startsWith('http')) return key
  return `/api/images/${key}`
}

// Only these file formats can actually carry an alpha channel. A JPEG (or
// any other opaque format) can never show a transparent area, so the
// checkerboard "transparency" backdrop should never be applied to one —
// showing it anyway is just visual noise, most noticeably as a flash
// behind lazy-loaded thumbnails before the image itself paints.
const ALPHA_EXTS = new Set(['png', 'webp', 'gif'])
export function keySupportsAlpha(key) {
  const ext = key?.split('.').pop()?.toLowerCase()
  return ALPHA_EXTS.has(ext)
}
