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
  getGenres: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return req(`/genres${q ? '?' + q : ''}`)
  },
  getAllGenres: (params = {}) => {
    const q = new URLSearchParams({ ...params, show_disabled: '1' }).toString()
    return req(`/genres?${q}`)
  },
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
  getCustomFields: (artistId = 1) => req(`/custom-fields?artist_id=${artistId}`),
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

  // Image upload
  uploadImage: async (file, token) => {
    const fd = new FormData()
    fd.append('image', file)
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
