import { useState, useEffect, useCallback } from 'react'
import { imgSrc } from '../utils/api'
import MetadataPanel from './MetadataPanel'

export default function ArtworkDetail({
  artwork, allArtworks, isAdmin, adminToken,
  onClose, onSaved, onNavigate, onDelete
}) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing]     = useState(false)

  // Close on Escape, navigate on arrow keys
  const handleKey = useCallback((e) => {
    // Don't intercept keys while typing in form fields
    const tag = e.target.tagName.toLowerCase()
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return

    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowRight') navigate('next')
    if (e.key === 'ArrowLeft')  navigate('prev')
    if (e.key === 'i') setPanelOpen(o => !o)
  }, [artwork, allArtworks]) // eslint-disable-line

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Reset panel and editing state when artwork changes
  useEffect(() => { setPanelOpen(false); setEditing(false) }, [artwork?.id])

  function navigate(dir) {
    if (!allArtworks?.length) return
    const idx = allArtworks.findIndex(a => a.id === artwork.id)
    if (idx < 0) return
    const next = dir === 'next'
      ? allArtworks[(idx + 1) % allArtworks.length]
      : allArtworks[(idx - 1 + allArtworks.length) % allArtworks.length]
    onNavigate(next)
  }

  if (!artwork) return null
  const src = imgSrc(artwork.image_key)

  // Pass through allGenres for the edit form
  const enriched = { ...artwork, _allGenres: artwork._allGenres }

  return (
    <div className="detail-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      {/* Close button */}
      <button className="detail-close" onClick={onClose} title="Close (Esc)">✕</button>

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

      {/* Main image */}
      <div className={`detail-image-area ${panelOpen ? 'panel-open' : ''}`}>
        {src
          ? <img className="detail-image" src={src} alt={artwork.title} />
          : <div style={{ color: '#888', fontSize: 72 }}>🖼</div>
        }
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
        isAdmin={isAdmin}
        adminToken={adminToken}
        isOpen={panelOpen}
        editing={editing}
        onEditingChange={setEditing}
        onToggle={() => setPanelOpen(o => !o)}
        onClose={onClose}
        onSaved={onSaved}
      />
    </div>
  )
}
