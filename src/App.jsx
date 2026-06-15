import { useState, useEffect, useCallback } from 'react'
import { api } from './utils/api'
import ArtworkCard from './components/ArtworkCard'
import ArtworkDetail from './components/ArtworkDetail'
import UploadDialog from './components/UploadDialog'
import CategoryManager from './components/CategoryManager'
import AdminLogin from './components/AdminLogin'
import SetPasswordModal from './components/SetPasswordModal'
import ChangePasswordModal from './components/ChangePasswordModal'
import HelpModal from './components/HelpModal'
import ViewerGate, { getViewerToken } from './components/ViewerGate'

// ─── Toast helper ──────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null)
  const show = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])
  return { toast, show }
}

function AdminBar({ onAddArtwork, onAddPhoto, onCategories, onChangePassword, trialLocked }) {
  return (
    <div className="admin-bar">
      <button className="btn btn-primary" onClick={onAddArtwork} disabled={trialLocked}>+ Add Artwork</button>
      <button className="btn btn-primary" onClick={onAddPhoto}   disabled={trialLocked}>📷 Add Photo</button>
      <button className="btn btn-ghost"   onClick={onCategories}>⚙ Catalog Settings</button>
      <button className="btn btn-ghost"   onClick={onChangePassword}>🔑 Change Password</button>
    </div>
  )
}

function TrialBanner({ artist }) {
  if (!artist?.trial_mode) return null

  const { trial_used, trial_limit, trial_days_left, trial_expired, trial_limit_hit } = artist
  const locked = trial_expired || trial_limit_hit

  const bg      = locked ? '#7f1d1d' : '#1e3a5f'
  const border  = locked ? '#991b1b' : '#1d4ed8'
  const message = trial_expired
    ? 'Your free trial has ended.'
    : trial_limit_hit
      ? `You've reached the ${trial_limit}-piece trial limit.`
      : `Free trial · ${trial_used} of ${trial_limit} pieces used · ${trial_days_left} day${trial_days_left === 1 ? '' : 's'} remaining`

  return (
    <div style={{
      background: bg,
      borderBottom: `1px solid ${border}`,
      padding: '7px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      fontSize: 13,
      color: '#e2e8f0',
    }}>
      <span>{message}</span>
      <a
        href="mailto:don.golden.gml@gmail.com?subject=Artie upgrade"
        style={{ color: '#93c5fd', fontWeight: 600, textDecoration: 'none' }}
      >
        {locked ? 'Contact us to upgrade →' : 'Upgrade anytime →'}
      </a>
    </div>
  )
}

export default function App() {
  // Viewer gate
  const [viewerUnlocked, setViewerUnlocked] = useState(() => !!getViewerToken())
  const [artists, setArtists]           = useState([])

  // If not yet unlocked, show PIN screen (pass artist name once we have it)
  // We load artist name optimistically via a lightweight fetch only when needed
  const [gateArtistName, setGateArtistName] = useState(null)

  useEffect(() => {
    if (!viewerUnlocked) {
      // Check whether VIEWER_PASSWORD is even configured on this site
      fetch('/api/auth/viewer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '' }),
      }).then(async r => {
        const data = await r.json()
        // If the site is open (no PIN configured), unlock immediately
        if (r.ok && data.token === 'open') setViewerUnlocked(true)
      }).catch(() => {})

      // Fetch artist name for the gate screen
      fetch('/api/artists').then(r => r.json()).then(data => {
        const name = data?.artists?.[0]?.name
        if (name) setGateArtistName(name)
      }).catch(() => {})
    }
  }, [viewerUnlocked])

  if (!viewerUnlocked) {
    return <ViewerGate artistName={gateArtistName} onUnlocked={() => setViewerUnlocked(true)} />
  }

  // Data
  const [artworks, setArtworks]         = useState([])
  const [genres, setGenres]             = useState([])   // all tags: medium, subject, style
  const [customFields, setCustomFields] = useState([])
  const [loading, setLoading]           = useState(true)

  // UI state
  const [selectedArtwork, setSelectedArtwork] = useState(null)
  const [filterGenre, setFilterGenre]         = useState(null)
  const [search, setSearch]                   = useState('')
  const [searchScope, setSearchScope]         = useState('all') // 'title' | 'all'

  // Admin
  const [adminToken, setAdminToken]     = useState(() => sessionStorage.getItem('adminToken'))
  const [isAdmin, setIsAdmin]           = useState(false)
  const [showLogin, setShowLogin]       = useState(false)
  const [sortMode, setSortMode]         = useState(() => localStorage.getItem('artie-sort') || 'manual')
  const [draggedId, setDraggedId]       = useState(null)
  const [showUpload, setShowUpload]     = useState(false)
  const [uploadType, setUploadType]     = useState('artwork') // 'artwork' | 'photograph'
  const [showCategories, setShowCategories]     = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

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
      if (filterGenre) params.genre_id = filterGenre
      if (search)      params.search   = search
      if (search)      params.search_scope = searchScope

      const [awRes, genreRes, fieldRes, artRes] = await Promise.all([
        api.getArtworks(params),
        api.getGenres(),
        api.getCustomFields(),
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
  }, [filterGenre, search, searchScope])

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

  // Reload grid only (used after save-and-close so overlay doesn't reopen)
  async function reloadGrid() {
    try {
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

  function handleLogin(token, mustChange = false) {
    setAdminToken(token)
    sessionStorage.setItem('adminToken', token)
    setShowLogin(false)
    if (mustChange) {
      setMustChangePassword(true)
    } else {
      setIsAdmin(true)
      showToast('Admin mode active')
    }
  }

  function handlePasswordSet(newToken) {
    setAdminToken(newToken)
    sessionStorage.setItem('adminToken', newToken)
    setMustChangePassword(false)
    setIsAdmin(true)
    showToast('Password set — admin mode active')
  }

  function handlePasswordChanged(newToken) {
    setAdminToken(newToken)
    sessionStorage.setItem('adminToken', newToken)
    setShowChangePassword(false)
    showToast('Password changed')
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

  function toggleSortMode(mode) {
    setSortMode(mode)
    localStorage.setItem('artie-sort', mode)
  }

  function handleDragStart(e, id) {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  async function handleDrop(e, targetId) {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) { setDraggedId(null); return }
    const arr = [...artworks]
    const fromIdx = arr.findIndex(a => a.id === draggedId)
    const toIdx   = arr.findIndex(a => a.id === targetId)
    if (fromIdx === -1 || toIdx === -1) { setDraggedId(null); return }
    const [moved] = arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, moved)
    const n = arr.length
    const order = arr.map((a, i) => ({ id: a.id, sort_order: n - i }))
    setArtworks(arr)
    setDraggedId(null)
    try {
      await api.reorderArtworks(order, adminToken)
    } catch {
      showToast('Failed to save order', 'error')
      loadAll()
    }
  }

  const displayed = sortMode === 'title'
    ? [...artworks].sort((a, b) => a.title.localeCompare(b.title))
    : artworks

  // Only show filter buttons for genres actually used by current artworks
  const usedGenreIds = new Set(artworks.flatMap(aw => (aw.genres || []).map(g => g.id)))

  const siteTitle = artists.length === 1 ? artists[0]?.name : 'Artist Catalog'

  return (
    <>
      {/* ── Header ── */}
      <header className="header">
        <div className="header-title">{siteTitle}</div>

        <div className="header-search">
          <span className="header-search-icon">🔍</span>
          <input
            placeholder={searchScope === 'title' ? 'Search titles…' : 'Search all fields…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="search-clear-btn"
              onClick={() => setSearch('')}
              title="Clear search"
            >✕</button>
          )}
        </div>
        <div className="search-scope-toggle">
          <button
            className={`scope-btn ${searchScope === 'title' ? 'active' : ''}`}
            onClick={() => setSearchScope('title')}
            title="Search titles only"
          >Title</button>
          <button
            className={`scope-btn ${searchScope === 'all' ? 'active' : ''}`}
            onClick={() => setSearchScope('all')}
            title="Search all text fields"
          >All Fields</button>
        </div>

        <button
          className="btn btn-ghost"
          style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 28, padding: '4px 8px' }}
          onClick={() => setShowHelp(true)}
          title="Getting started guide"
        >?</button>

        {!isAdmin
          ? <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowLogin(true)}>
              Admin
            </button>
          : <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', opacity: 0.85 }}>✦ ADMIN</span>
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={handleLogout}>Log out</button>
            </div>
        }
      </header>

      {/* ── Trial Banner ── */}
      <TrialBanner artist={artists[0]} />

      {/* ── Admin Bar ── */}
      {isAdmin && (
        <AdminBar
          onAddArtwork={() => { setUploadType('artwork'); setShowUpload(true) }}
          onAddPhoto={() => { setUploadType('photograph'); setShowUpload(true) }}
          onCategories={() => setShowCategories(true)}
          onChangePassword={() => setShowChangePassword(true)}
          trialLocked={!!(artists[0]?.trial_expired || artists[0]?.trial_limit_hit)}
        />
      )}

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

        {/* Tag filters — only show tags used by actual artworks */}
        {['subject', 'medium', 'style'].map(type => {
          const group = genres.filter(g => g.tag_type === type && usedGenreIds.has(g.id))
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

        <div className="filter-bar-right">
          <div className="search-scope-toggle">
            <button className={`scope-btn ${sortMode === 'title' ? 'active' : ''}`} onClick={() => toggleSortMode('title')} title="Sort alphabetically by title">Title</button>
            <button className={`scope-btn ${sortMode === 'manual' ? 'active' : ''}`} onClick={() => toggleSortMode('manual')} title={isAdmin ? 'Manual order — drag to rearrange' : 'Manual order'}>Manual</button>
          </div>
          {!loading && (
            <span className="artwork-count">
              {displayed.length} {displayed.length === 1 ? 'piece' : 'pieces'}
            </span>
          )}
        </div>
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
                <h3>{search || filterGenre ? 'No artworks found' : 'No artworks yet'}</h3>
                <p>{search || filterGenre ? 'Try a different search or filter.' : isAdmin ? 'Click "Add Artwork" to add your first piece.' : 'Come back soon.'}</p>
                {!search && !filterGenre && isAdmin && (
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
                  draggable={isAdmin && sortMode === 'manual'}
                  onDragStart={e => handleDragStart(e, aw.id)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(e, aw.id)}
                  isDragging={draggedId === aw.id}
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
          onSavedAndClose={reloadGrid}
          onNavigate={openArtwork}
          onDelete={handleDeleteArtwork}
        />
      )}

      {/* ── Modals ── */}
      {showUpload && (
        <UploadDialog
          genres={genres}
          customFields={customFields}
          artistId={artists[0]?.id || 1}
          artworkType={uploadType}
          adminToken={adminToken}
          onClose={() => setShowUpload(false)}
          onSaved={() => { loadAll(); showToast(uploadType === 'photograph' ? 'Photo added!' : 'Artwork added!') }}
        />
      )}

      {showCategories && (
        <CategoryManager
          customFields={customFields}
          artistId={artists[0]?.id || 1}
          adminToken={adminToken}
          onClose={() => setShowCategories(false)}
          onSaved={loadAll}
        />
      )}

      {showLogin && (
        <AdminLogin onLogin={handleLogin} onClose={() => setShowLogin(false)} />
      )}

      {mustChangePassword && (
        <SetPasswordModal adminToken={adminToken} onDone={handlePasswordSet} />
      )}

      {showChangePassword && (
        <ChangePasswordModal
          adminToken={adminToken}
          onDone={handlePasswordChanged}
          onClose={() => setShowChangePassword(false)}
        />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* ── Toast ── */}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}
    </>
  )
}
