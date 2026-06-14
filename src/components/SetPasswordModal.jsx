import { useState } from 'react'
import { api } from '../utils/api'

function PasswordInput({ value, onChange, placeholder, autoFocus }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{ paddingRight: 36, width: '100%', boxSizing: 'border-box' }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 14, padding: 0
        }}
        tabIndex={-1}
        title={show ? 'Hide password' : 'Show password'}
      >
        {show ? '🙈' : '👁'}
      </button>
    </div>
  )
}

export default function SetPasswordModal({ adminToken, onDone }) {
  const [newPassword, setNewPassword]     = useState('')
  const [confirm, setConfirm]             = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (newPassword !== confirm)  { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const { token } = await api.changePassword(adminToken, newPassword)
      onDone(token)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop login-modal">
      <div className="modal">
        <div className="modal-header">
          <h2>Set Your Password</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              This is your first login. Please set a personal password to secure your catalog.
            </p>
            <div className="form-row">
              <label>New Password</label>
              <PasswordInput
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoFocus
              />
            </div>
            <div className="form-row">
              <label>Confirm Password</label>
              <PasswordInput
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
              />
            </div>
            {error && <div style={{ color: '#b91c1c', fontSize: 13, marginTop: 4 }}>{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="submit" className="btn btn-primary"
              disabled={loading || !newPassword || !confirm}>
              {loading ? 'Saving…' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
