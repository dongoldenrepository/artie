import { useState } from 'react'

export default function ChangeViewerPinModal({ adminToken, onDone, onClose }) {
  const [pin, setPin]         = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (pin.length < 4)    { setError('PIN must be at least 4 characters.'); return }
    if (pin !== confirm)   { setError('PINs do not match.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/viewer-pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update PIN')
      onDone(pin)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Change Viewer PIN</h2>
          <button className="btn-icon" style={{ fontSize: 20, color: '#888' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 0 }}>
              This PIN is what guests enter to view your gallery.
              Share it with anyone you want to have access.
            </p>
            <div className="form-row">
              <label>New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="At least 4 characters"
                autoFocus
              />
            </div>
            <div className="form-row">
              <label>Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat new PIN"
              />
            </div>
            {error && <div style={{ color: '#b91c1c', fontSize: 13, marginTop: 4 }}>{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"
              disabled={loading || !pin || !confirm}>
              {loading ? 'Saving…' : 'Save PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
