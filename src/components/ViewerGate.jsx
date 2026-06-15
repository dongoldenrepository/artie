import { useState } from 'react'
import { api } from '../utils/api'

const STORAGE_KEY = 'artie-viewer-token'

export function getViewerToken() {
  return localStorage.getItem(STORAGE_KEY)
}

export function clearViewerToken() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function ViewerGate({ artistName, onUnlocked }) {
  const [pin, setPin]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/viewer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError('Incorrect PIN. Try again.')
        setPin('')
      } else {
        localStorage.setItem(STORAGE_KEY, data.token)
        onUnlocked()
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#111',
      padding: 24,
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 12,
        padding: '40px 48px',
        width: '100%',
        maxWidth: 360,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎨</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22,
          fontWeight: 600,
          color: '#e2e8f0',
          margin: '0 0 6px',
        }}>
          {artistName || 'Artist Gallery'}
        </h1>
        <p style={{ color: '#888', fontSize: 14, margin: '0 0 28px' }}>
          Enter your access PIN to view this gallery.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="PIN"
            autoFocus
            style={{
              width: '100%',
              padding: '10px 14px',
              background: '#111',
              border: '1px solid #444',
              borderRadius: 8,
              color: '#e2e8f0',
              fontSize: 18,
              textAlign: 'center',
              letterSpacing: 6,
              boxSizing: 'border-box',
              marginBottom: 12,
              outline: 'none',
            }}
          />
          {error && (
            <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !pin}
            style={{
              width: '100%',
              padding: '10px 0',
              background: pin && !loading ? '#3b82f6' : '#1e3a5f',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: pin && !loading ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Checking…' : 'Enter Gallery'}
          </button>
        </form>
      </div>
    </div>
  )
}
