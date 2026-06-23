import { useState, useRef } from 'react'
import { api } from '../utils/api'

const TAG_LABELS = { medium: 'Medium', subject: 'Subject', style: 'Style' }

export default function UploadDialog({ genres = [], customFields, artistId = 1, defaultMedium = '', artworkType = 'artwork', adminToken, onClose, onSaved }) {
  const isPhoto = artworkType === 'photograph'
  const [form, setForm] = useState({
    title: '', medium: defaultMedium, size: '', price: '',
    date_created: '', current_location: '', description: '',
    is_available: 1,
    genres: [],       // all selected tag ids (medium + subject + style)
    custom_values: {}
  })
  const [imageFile, setImageFile]       = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [drag, setDrag]                 = useState(false)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState(null)
  const fileRef = useRef()

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function toggleTag(id) {
    setForm(f => ({
      ...f,
      genres: f.genres.includes(id)
        ? f.genres.filter(x => x !== id)
        : [...f.genres, id]
    }))
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
  }

  function onDrop(e) {
    e.preventDefault(); setDrag(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true); setError(null)
    try {
      let image_key = null
      if (imageFile) {
        const res = await api.uploadImage(imageFile, adminToken)
        image_key = res.key
      }
      await api.createArtwork({
        ...form,
        price: form.price !== '' ? Number(form.price) : null,
        is_available: Number(form.is_available),
        artist_id: artistId,
        artwork_type: artworkType,
        image_key,
      }, adminToken)
      onSaved()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Build tag groups for display
  const tagGroups = ['medium', 'subject', 'style'].map(type => ({
    type,
    label: TAG_LABELS[type],
    tags: genres.filter(g => g.tag_type === type),
  })).filter(g => g.tags.length > 0)

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isPhoto ? 'Add New Photo' : 'Add New Artwork'}</h2>
          <button className="btn-icon" style={{ fontSize: 20, color: '#888' }} onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* ── Image upload ── */}
          <div className="form-row">
            <label>Image</label>
            <div
              className={`image-drop-area ${drag ? 'drag-over' : ''}`}
              onClick={() => fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
            >
              {imagePreview
                ? <img className="image-preview" src={imagePreview} alt="Preview" />
                : <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                    <div style={{ fontSize: 14 }}>Click or drag an image here</div>
                    <div style={{ fontSize: 12, marginTop: 4, color: '#999' }}>JPG, PNG, WEBP supported</div>
                  </>
              }
            </div>
            <input
              type="file" ref={fileRef} accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
          </div>

          {/* ── Title ── */}
          <div className="form-row">
            <label>Title *</label>
            <input value={form.title} onChange={e => setField('title', e.target.value)} autoFocus />
          </div>

          <div className="form-row-2">
            <div className="form-row">
              <label>Medium</label>
              <input value={form.medium} onChange={e => setField('medium', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Size</label>
              <input value={form.size} onChange={e => setField('size', e.target.value)} />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-row">
              <label>Price ($)</label>
              <input type="number" value={form.price} onChange={e => setField('price', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Date Created</label>
              <input value={form.date_created} onChange={e => setField('date_created', e.target.value)} />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-row">
              <label>Current Location</label>
              <input value={form.current_location} onChange={e => setField('current_location', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Available for Sale</label>
              <select value={form.is_available} onChange={e => setField('is_available', Number(e.target.value))}>
                <option value={1}>Yes</option>
                <option value={0}>No</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={3} />
          </div>

          {/* ── Medium / Subject / Style tag pickers ── */}
          {tagGroups.map(group => (
            <div key={group.type} className="form-row">
              <label>
                {group.label}
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}> (optional, multi-select)</span>
              </label>
              <div className="cat-checkbox-grid">
                {group.tags.map(g => (
                  <label key={g.id}
                    className={`cat-checkbox-item ${form.genres.includes(g.id) ? 'selected' : ''}`}
                    style={{ color: g.color }}
                    onClick={() => toggleTag(g.id)}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                    {g.name}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* ── Custom fields ── */}
          {customFields?.length > 0 && (
            <div className="form-row">
              <label>Additional Details</label>
              {customFields.map(f => (
                <div key={f.id} style={{ marginBottom: 8 }}>
                  <label>{f.name}</label>
                  <input
                    type={f.field_type === 'number' ? 'number' : f.field_type === 'date' ? 'date' : 'text'}
                    value={form.custom_values[f.id] || ''}
                    onChange={e => setField('custom_values', { ...form.custom_values, [f.id]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}

          {error && <div style={{ color: '#b91c1c', fontSize: 13, marginTop: 8 }}>{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : isPhoto ? 'Add Photo' : 'Add Artwork'}
          </button>
        </div>
      </div>
    </div>
  )
}
