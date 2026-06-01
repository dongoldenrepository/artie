import { imgSrc } from '../utils/api'

export default function ArtworkCard({ artwork, isAdmin, onClick, onDelete }) {
  function handleDelete(e) {
    e.stopPropagation()
    if (window.confirm(`Delete "${artwork.title}"? This cannot be undone.`)) {
      onDelete(artwork.id)
    }
  }

  const src = imgSrc(artwork.image_key)

  // Use category.is_printable to drive print display (falls back to artwork_type for legacy rows)
  const isPrintable = artwork.is_printable === 1 || artwork.artwork_type === 'photograph'

  const priceStr = !isPrintable && artwork.price != null
    ? '$' + Number(artwork.price).toLocaleString()
    : null

  const metaParts = [artwork.medium, !isPrintable && artwork.size].filter(Boolean)

  const printLabel = isPrintable
    ? (artwork.print_count > 0
        ? `${artwork.prints_available} of ${artwork.print_count} prints available`
        : 'No prints yet')
    : null

  // Show genre tags (style tags) in the card badges
  const badgeItems = artwork.genres || []

  return (
    <div className="artwork-card" onClick={() => onClick(artwork)}>
      <div className="card-image-wrap">
        {src
          ? <img src={src} alt={artwork.title} loading="lazy" />
          : <div className="card-placeholder">🖼</div>
        }
      </div>

      {isAdmin && (
        <div className="card-admin-actions" onClick={e => e.stopPropagation()}>
          <button className="btn-icon" title="Delete" onClick={handleDelete}>🗑</button>
        </div>
      )}

      <div className="card-body">
        <div className="card-title" title={artwork.title}>{artwork.title}</div>
        {metaParts.length > 0 && (
          <div className="card-meta">{metaParts.join(' · ')}</div>
        )}
        {priceStr && <div className="card-price">{priceStr}</div>}
        {printLabel && (
          <div className="card-print-label">{printLabel}</div>
        )}
        {badgeItems.length > 0 && (
          <div className="card-badges">
            {badgeItems.slice(0, 3).map(g => (
              <span key={g.id} className="badge" style={{ background: g.color }}>
                {g.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
