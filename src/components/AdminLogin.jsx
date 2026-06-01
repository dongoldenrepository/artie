import { useState } from 'react'
import { api } from '../utils/api'

export default function AdminLogin({ onLogin, onClose }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const { token } = await api.login(password)
      sessionStorage.setItem('adminToken', token)
      onLogin(token)
    } catch {
      setError('Incorrect password. Try again.')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop login-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Admin Login</h2>
          <button className="btn-icon" style={{ fontSize: 20, color: '#888' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            {error && <div style={{ color: '#b91c1c', fontSize: 13, marginTop: 4 }}>{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !password}>
              {loading ? 'Checking…' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
