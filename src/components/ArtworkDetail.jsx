import { useState, useEffect, useCallback, useRef } from 'react'
import { imgSrc, api } from '../utils/api'
import MetadataPanel from './MetadataPanel'
import BackgroundColorPicker from './BackgroundColorPicker'

// File types that can carry an alpha channel — only these are offered the
// background-color picker, per the "only if the format accommodates
// transparency" requirement.
const ALPHA_EXTS = new Set(['png', 'webp', 'gif'])
function keySupportsAlpha(key) {
  const ext = key?.split('.').pop()?.toLowerCase()
  return ALPHA_EXTS.has(ext)
}

export default function ArtworkDetail({
  artwork, allArtworks, existingTitles = [], isAdmin, adminToken,
  onClose, onSaved, onSavedAndClose, onNavigate, onDelete
}) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing]     = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [extraImages, setExtraImages] = useState([])
  const [panelDirty, setPanelDirty]     = useState(false)
  const [showDirtyDialog, setShowDirtyDialog] = useState(false)
  const [saveRequested, setSaveRequested]     = useState(0)
  const [bgOverrides, setBgOverrides]   = useState({}) // { [imageId]: colorOrNull } — optimistic local edits
  const [bgPickerOpen, setBgPickerOpen] = useState(false)
  const pendingCloseRef = useRef(false)

  // Fetch extra images directly from API whenever artwork changes
  useEffect(() => {
    setActiveIdx(0)
    setBgOverrides({})
    setBgPickerOpen(false)
    if (!artwork?.id) return
    api.getArtworkImages(artwork.id)
      .then(r => setExtraImages(r.images || []))
      .catch(() => setExtraImages([]))
  }, [artwork?.id])

  // Build image list: main image first, then extra images
  const allImages = [
    ...(artwork?.image_key ? [{
      key: artwork.image_key, id: 'main',
      background_color: 'main' in bgOverrides ? bgOverrides.main : artwork.background_color,
    }] : []),
    ...extraImages.map(i => ({
      key: i.image_key, id: i.id, caption: i.caption,
      background_color: i.id in bgOverrides ? bgOverrides[i.id] : i.background_color,
    }))
  ]

  const activeImg      = allImages[activeIdx]
  const activeBgColor  = activeImg?.background_color ?? null
  const activeCanHaveAlpha = keySupportsAlpha(activeImg?.key)

  // Colors already used on other pieces, so the artist isn't hand-matching
  const usedSwatches = [...new Set((allArtworks || []).map(a => a.background_color).filter(Boolean))]

  async function handleBgColorChange(color) {
    const img = allImages[activeIdx]
    if (!img) return
    const hadPrev = img.id in bgOverrides
    const prev = bgOverrides[img.id]
    setBgOverrides(o => ({ ...o, [img.id]: color }))
    setBgPickerOpen(false)
    try {
      if (img.id === 'main') {
        await api.updateArtwork(artwork.id, { background_color: color }, adminToken)
      } else {
        await api.updateArtworkImage(img.id, { background_color: color }, adminToken)
      }
    } catch (e) {
      setBgOverrides(o => {
        const n = { ...o }
        if (hadPrev) n[img.id] = prev
        else delete n[img.id]
        return n
      })
      alert('Could not save background color: ' + e.message)
    }
  }

  // Preload adjacent images so navigation feels instant
  useEffect(() => {
    if (allImages.length <= 1) return
    const toPreload = [activeIdx + 1, activeIdx + 2, activeIdx - 1]
      .filter(i => i >= 0 && i < allImages.length)
    toPreload.forEach(i => {
      const img = new Image()
      img.src = imgSrc(allImages[i].key)
    })
  }, [activeIdx, allImages])

  // Close on Escape, navigate on arrow keys
  const handleKey = useCallback((e) => {
    // Don't intercept keys while typing in form fields
    const tag = e.target.tagName.toLowerCase()
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return

    if (e.key === 'Escape') { handleClose(); return }
    if (e.key === 'ArrowRight') navigate('next')
    if (e.key === 'ArrowLeft')  navigate('prev')
    if (e.key === 'i') setPanelOpen(o => !o)
  }, [artwork, allArtworks, editing, panelDirty, activeIdx, allImages.length]) // eslint-disable-line

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Reset panel and editing state when artwork changes
  useEffect(() => { setPanelOpen(false); setEditing(false) }, [artwork?.id])

  // Close the background-color popover when switching images
  useEffect(() => { setBgPickerOpen(false) }, [activeIdx])

  function navigate(dir) {
    // First cycle through images within this artwork
    if (dir === 'next' && activeIdx < allImages.length - 1) {
      setActiveIdx(activeIdx + 1); return
    }
    if (dir === 'prev' && activeIdx > 0) {
      setActiveIdx(activeIdx - 1); return
    }
    // At boundary — move to adjacent artwork
    if (!allArtworks?.length) return
    const idx = allArtworks.findIndex(a => a.id === artwork.id)
    if (idx < 0) return
    const next = dir === 'next'
      ? allArtworks[(idx + 1) % allArtworks.length]
      : allArtworks[(idx - 1 + allArtworks.length) % allArtworks.length]
    onNavigate(next)
  }

  // Guard close against unsaved edits
  function handleClose() {
    if (editing && panelDirty) { setShowDirtyDialog(true); return }
    onClose()
  }

  function handleSaveAndClose() {
    setShowDirtyDialog(false)
    pendingCloseRef.current = true
    setSaveRequested(n => n + 1)
  }

  function handleDiscardAndClose() {
    setShowDirtyDialog(false)
    onClose()
  }

  // Called by MetadataPanel after a successful save
  function handlePanelSaved() {
    if (pendingCloseRef.current) {
      pendingCloseRef.current = false
      onSavedAndClose?.()   // reloads grid without reopening overlay
      onClose()
    } else {
      onSaved()
    }
  }

  if (!artwork) return null
  const activeSrc = allImages[activeIdx] ? imgSrc(allImages[activeIdx].key) : null

  // Pass through allGenres for the edit form
  const enriched = { ...artwork, _allGenres: artwork._allGenres }

  return (
    <div className="detail-overlay" onClick={e => { if (e.target === e.currentTarget) handleClose() }}>

      {/* Close button */}
      <button className="detail-close" onClick={handleClose} title="Close (Esc)">✕</button>

      {/* Admin delete button */}
      {isAdmin && (
        <button
          className="detail-delete"
          title="Delete artwork"
          onClick={() => {
            if (window.confirm(`Delete "${artwork.title}"? This cannot be undone.`)) {
              onDelete(artwork.id)
            }
          }}
        >
          🗑 Delete
        </button>
      )}

      {/* Navigation arrows — hidden while editing */}
      {allArtworks?.length > 1 && !editing && (
        <>
          <button className="detail-nav prev" onClick={() => navigate('prev')} title="Previous">‹</button>
          <button className="detail-nav next" onClick={() => navigate('next')} title="Next">›</button>
        </>
      )}

      {/* Main image + thumbnail strip */}
      <div className={`detail-image-area ${panelOpen ? 'panel-open' : ''}`}
        style={{ flexDirection: 'column', gap: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, width: '100%' }}>
          {activeSrc
            ? (
              <div
                className={`detail-image-backdrop${activeBgColor ? '' : ' checkerboard-bg'}`}
                style={activeBgColor ? { backgroundColor: activeBgColor } : undefined}
                onContextMenu={e => {
                  if (!isAdmin || !activeCanHaveAlpha) return
                  e.preventDefault()
                  setBgPickerOpen(o => !o)
                }}
              >
                <img className="detail-image" src={activeSrc} alt={artwork.title} />

                {isAdmin && activeCanHaveAlpha && (
                  <button
                    className="bg-color-trigger"
                    style={{ background: activeBgColor || 'conic-gradient(#fff 0 25%, #ccc 0 50%, #fff 0 75%, #ccc 0)' }}
                    title="Set background color (or right-click the image)"
                    onClick={e => { e.stopPropagation(); setBgPickerOpen(o => !o) }}
                  />
                )}

                {bgPickerOpen && (
                  <BackgroundColorPicker
                    value={activeBgColor}
                    swatches={usedSwatches}
                    onChange={handleBgColorChange}
                    onClose={() => setBgPickerOpen(false)}
                  />
                )}
              </div>
            )
            : <div style={{ color: '#888', fontSize: 72 }}>🖼</div>
          }
        </div>
        {allImages.length > 1 && (
          <div style={{
            display: 'flex', gap: 6, padding: '8px 10px', flexShrink: 0,
            background: 'rgba(0,0,0,0.7)', borderRadius: 8, margin: '0 0 80px 20px',
            backdropFilter: 'blur(4px)', position: 'relative', zIndex: 10
          }}>
            {allImages.map((img, idx) => (
              <button key={img.id} onClick={() => setActiveIdx(idx)} style={{
                width: 52, height: 40, padding: 0, border: 'none', borderRadius: 4,
                outline: idx === activeIdx ? '2px solid #f0ece4' : '2px solid transparent',
                cursor: 'pointer', overflow: 'hidden', flexShrink: 0, opacity: idx === activeIdx ? 1 : 0.6,
                transition: 'opacity 0.15s, outline 0.15s',
                background: img.background_color || '#fff'
              }}>
                <img src={imgSrc(img.key)} alt={img.caption || `View ${idx + 1}`}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Title bar (shown when panel is closed) */}
      <div className={`detail-info-bar ${panelOpen ? 'panel-open' : ''}`}>
        <div className="detail-title-block">
          <h2>{artwork.title}</h2>
          <p>
            {[artwork.artist_name, artwork.medium, artwork.date_created]
              .filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {/* Metadata toggle button */}
      <button
        className={`metadata-toggle ${panelOpen ? 'open' : ''}`}
        onClick={() => setPanelOpen(o => !o)}
        title="Toggle details (i)"
      >
        {panelOpen ? '▼ Hide Details' : '▲ Show Details'}
      </button>

      {/* Slide-up metadata panel */}
      <MetadataPanel
        artwork={enriched}
        existingTitles={existingTitles.filter(t => t !== artwork?.title)}
        isAdmin={isAdmin}
        adminToken={adminToken}
        isOpen={panelOpen}
        editing={editing}
        onEditingChange={setEditing}
        onToggle={() => setPanelOpen(o => !o)}
        extraImages={extraImages}
        onExtraImagesChange={setExtraImages}
        onClose={handleClose}
        onSaved={handlePanelSaved}
        onDirtyChange={setPanelDirty}
        saveRequested={saveRequested}
      />

      {/* Unsaved changes dialog */}
      {showDirtyDialog && (
        <div className="dirty-dialog-overlay" onClick={() => setShowDirtyDialog(false)}>
          <div className="dirty-dialog" onClick={e => e.stopPropagation()}>
            <h3>Unsaved Changes</h3>
            <p>You have unsaved edits. Save them before closing, or discard?</p>
            <div className="dirty-dialog-actions">
              <button className="btn btn-ghost" onClick={() => setShowDirtyDialog(false)}>Keep Editing</button>
              <button className="btn btn-ghost" style={{ color: '#e07070' }} onClick={handleDiscardAndClose}>Discard</button>
              <button className="btn btn-primary" onClick={handleSaveAndClose}>Save & Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
