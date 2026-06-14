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

export default function ChangePasswordModal({ adminToken, onDone, onClose }) {
  const [current, setCurrent]         = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm]         = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return }
    if (newPassword !== confirm)  { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const { token } = await api.changePassword(current, newPassword)
      onDone(token)
    } catch (e) {
      setError(e.message || 'Current password is incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Change Password</h2>
          <button className="btn-icon" style={{ fontSize: 20, color: '#888' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <label>Current Password</label>
              <PasswordInput
                value={current}
                onChange={e => setCurrent(e.target.value)}
                placeholder="Your current password"
                autoFocus
              />
            </div>
            <div className="form-row">
              <label>New Password</label>
              <PasswordInput
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="form-row">
              <label>Confirm New Password</label>
              <PasswordInput
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
            {error && <div style={{ color: '#b91c1c', fontSize: 13, marginTop: 4 }}>{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"
              disabled={loading || !current || !newPassword || !confirm}>
              {loading ? 'Saving…' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
