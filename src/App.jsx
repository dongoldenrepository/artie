import { useState, useEffect, useCallback } from 'react'
import { api } from './utils/api'
import ArtworkCard from './components/ArtworkCard'
import ArtworkDetail from './components/ArtworkDetail'
import UploadDialog from './components/UploadDialog'
import CategoryManager from './components/CategoryManager'
import AdminLogin from './components/AdminLogin'

// ─── Toast helper ──────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null)
  const show = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])
  return { toast, show }
}

function AdminBar({ onAddArtwork, onCategories }) {
  return (
    <div className="admin-bar">
      <span className="admin-bar-label">✦ Admin Mode</span>
      <button className="btn btn-primary" onClick={onAddArtwork}>+ Add Artwork</button>
      <button className="btn btn-ghost" onClick={onCategories}>⚙ Tags & Fields</button>
    </div>
  )
}

export default function App() {
  // Data
  const [artworks, setArtworks]         = useState([])
  const [genres, setGenres]             = useState([])   // all tags: medium, subject, style
  const [customFields, setCustomFields] = useState([])
  const [artists, setArtists]           = useState([])
  const [loading, setLoading]           = useState(true)

  // UI state
  const [selectedArtwork, setSelectedArtwork] = useState(null)
  const [filterGenre, setFilterGenre]         = useState(null)
  const [filterArtist, setFilterArtist]       = useState(null)
  const [search, setSearch]                   = useState('')

  // Admin
  const [adminToken, setAdminToken]     = useState(() => sessionStorage.getItem('adminToken'))
  const [isAdmin, setIsAdmin]           = useState(false)
  const [showLogin, setShowLogin]       = useState(false)
  const [showUpload, setShowUpload]     = useState(false)
  const [showCategories, setShowCategories] = useState(false)

  const { toast, show: showToast } = useToast()

  // Validate stored admin token on mount
  useEffect(() => {
    if (adminToken) {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminToken })
      }).then(r => {
        if (r.ok) setIsAdmin(true)
        else { sessionStorage.removeItem('adminToken'); setAdminToken(null) }
      }).catch(() => {})
    }
  }, [])

  // Load initial data
  const loadAll = useCallback(async () => {
    try {
      const params = {}
      if (filterArtist) params.artist_id = filterArtist
      if (filterGenre)  params.genre_id  = filterGenre
      if (search)       params.search    = search

      const artistParam = filterArtist ? { artist_id: filterArtist } : {}

      const [awRes, genreRes, fieldRes, artRes] = await Promise.all([
        api.getArtworks(params),
        api.getGenres(artistParam),
        api.getCustomFields(filterArtist || 1),
        api.getArtists(),
      ])

      setArtworks(awRes.artworks || [])
      setGenres(genreRes.genres || [])
      setCustomFields(fieldRes.fields || [])
      setArtists(artRes.artists || [])
    } catch (e) {
      showToast('Failed to load: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [filterArtist, filterGenre, search])

  useEffect(() => { loadAll() }, [loadAll])

  // Reload artwork detail after edit
  async function reloadSelected() {
    if (!selectedArtwork) return
    try {
      const fresh = await api.getArtwork(selectedArtwork.id)
      fresh._allGenres = genres
      setSelectedArtwork(fresh)
      await loadAll()
      showToast('Saved!')
    } catch {}
  }

  async function openArtwork(artwork) {
    try {
      const full = await api.getArtwork(artwork.id)
      full._allGenres = genres
      setSelectedArtwork(full)
    } catch {
      setSelectedArtwork({ ...artwork, _allGenres: genres })
    }
  }

  function handleLogin(token) {
    setAdminToken(token)
    setIsAdmin(true)
    setShowLogin(false)
    showToast('Admin mode active')
  }

  function handleLogout() {
    sessionStorage.removeItem('adminToken')
    setAdminToken(null)
    setIsAdmin(false)
    showToast('Logged out')
  }

  async function handleDeleteArtwork(id) {
    try {
      await api.deleteArtwork(id, adminToken)
      await loadAll()
      if (selectedArtwork?.id === id) setSelectedArtwork(null)
      showToast('Artwork deleted')
    } catch (e) {
      showToast('Delete failed: ' + e.message, 'error')
    }
  }

  const displayed = artworks

  const siteTitle = artists.length === 1 ? artists[0]?.name : 'Artist Catalog'

  return (
    <>
      {/* ── Header ── */}
      <header className="header">
        <div className="header-title">{siteTitle}</div>

        <div className="header-search">
          <span className="header-search-icon">🔍</span>
          <input
            placeholder="Search works…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {!isAdmin
          ? <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowLogin(true)}>
              Admin
            </button>
          : <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={handleLogout}>
              Log out
            </button>
        }
      </header>

      {/* ── Admin Bar ── */}
      {isAdmin && <AdminBar
        onAddArtwork={() => setShowUpload(true)}
        onCategories={() => setShowCategories(true)}
      />}

      {/* ── Filter Bar ── */}
      <div className="filter-bar">
        {/* All filter */}
        <button
          className={`filter-chip ${!filterGenre ? 'active' : ''}`}
          style={!filterGenre ? { background: '#1a1a1a', borderColor: '#1a1a1a' } : {}}
          onClick={() => setFilterGenre(null)}
        >
          All
        </button>

        {/* Tag filters — grouped by type with dividers */}
        {['subject', 'medium', 'style'].map(type => {
          const group = genres.filter(g => g.tag_type === type)
          if (!group.length) return null
          return group.map(g => (
            <button
              key={g.id}
              className={`filter-chip ${filterGenre === g.id ? 'active' : ''}`}
              style={filterGenre === g.id ? { background: g.color, borderColor: g.color } : {}}
              onClick={() => setFilterGenre(filterGenre === g.id ? null : g.id)}
            >
              <span className="filter-chip-dot" style={{ background: g.color }} />
              {g.name}
            </button>
          ))
        })}

        {artists.length > 1 && (
          <select
            className="filter-artist-select"
            value={filterArtist || ''}
            onChange={e => setFilterArtist(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All Artists</option>
            {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
      </div>

      {/* ── Main Grid ── */}
      <main className="grid-container">
        {loading ? (
          <div className="loading-screen">
            <div className="spinner" />
            <span>Loading catalog…</span>
          </div>
        ) : (
          <div className="artwork-grid">
            {displayed.length === 0 ? (
              <div className="empty-state">
                <h3>No artworks yet</h3>
                <p>{isAdmin ? 'Click "Add Artwork" to add your first piece.' : 'Come back soon.'}</p>
                {isAdmin && (
                  <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
                    + Add Artwork
                  </button>
                )}
              </div>
            ) : (
              displayed.map(aw => (
                <ArtworkCard
                  key={aw.id}
                  artwork={aw}
                  isAdmin={isAdmin}
                  onClick={openArtwork}
                  onDelete={handleDeleteArtwork}
                />
              ))
            )}
          </div>
        )}
      </main>

      {/* ── Detail Overlay ── */}
      {selectedArtwork && (
        <ArtworkDetail
          artwork={selectedArtwork}
          allArtworks={displayed}
          isAdmin={isAdmin}
          adminToken={adminToken}
          onClose={() => setSelectedArtwork(null)}
          onSaved={reloadSelected}
          onNavigate={openArtwork}
          onDelete={handleDeleteArtwork}
        />
      )}

      {/* ── Modals ── */}
      {showUpload && (
        <UploadDialog
          genres={genres}
          customFields={customFields}
          artistId={filterArtist || (artists[0]?.id || 1)}
          adminToken={adminToken}
          onClose={() => setShowUpload(false)}
          onSaved={() => { loadAll(); showToast('Artwork added!') }}
        />
      )}

      {showCategories && (
        <CategoryManager
          customFields={customFields}
          artistId={filterArtist || (artists[0]?.id || 1)}
          adminToken={adminToken}
          onClose={() => setShowCategories(false)}
          onSaved={loadAll}
        />
      )}

      {showLogin && (
        <AdminLogin onLogin={handleLogin} onClose={() => setShowLogin(false)} />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}
    </>
  )
}
