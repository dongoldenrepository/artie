import { useState, useEffect } from 'react'
import { api, imgSrc } from '../utils/api'

const PRINT_MEDIUMS = ['Aluminum', 'Fiber', 'Glossy', 'Matte', 'Canvas']

const BLANK_PRINT = { size: '', medium: 'Aluminum', price: '', current_location: '', sold_to: '', is_available: 1, notes: '' }

const PRICE_FMT = v => v != null ? '$' + Number(v).toLocaleString() : '—'
const DATE_FMT  = v => v || '—'

export default function MetadataPanel({
  artwork, isAdmin, adminToken, isOpen,
  editing = false, onEditingChange,
  onToggle, onClose, onSaved
}) {
  function setEditing(val) { onEditingChange?.(val) }
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [prints, setPrints] = useState([])
  const [addingPrint, setAddingPrint] = useState(false)
  const [newPrint, setNewPrint] = useState({ ...BLANK_PRINT })
  const [editingPrintId, setEditingPrintId] = useState(null)
  const [editingPrint, setEditingPrint] = useState(null)

  // Is this artwork printable? Check if any medium tag is Photography, Digital Creation, or Printmaking
  const PRINTABLE_MEDIUMS = ['Photography', 'Digital Creation', 'Printmaking']
  const isPrintable = artwork?.genres?.some(g => g.tag_type === 'medium' && PRINTABLE_MEDIUMS.includes(g.name))
    || artwork?.artwork_type === 'photograph' // legacy fallback

  // Clear image + print state when artwork changes
  useEffect(() => {
    setImageFile(null)
    setImagePreview(null)
    setPrints(artwork?.prints || [])
    setAddingPrint(false)
    setNewPrint({ ...BLANK_PRINT })
    setEditingPrintId(null)
  }, [artwork?.id])

  // Keep prints in sync when artwork updates
  useEffect(() => {
    setPrints(artwork?.prints || [])
  }, [artwork?.prints])

  async function handleAddPrint() {
    try {
      await api.createPrint({ ...newPrint, artwork_id: artwork.id, price: newPrint.price !== '' ? Number(newPrint.price) : null }, adminToken)
      setAddingPrint(false)
      setNewPrint({ ...BLANK_PRINT })
      onSaved()
    } catch (e) { setError(e.message) }
  }

  async function handleUpdatePrint(id) {
    try {
      await api.updatePrint(id, { ...editingPrint, price: editingPrint.price !== '' ? Number(editingPrint.price) : null }, adminToken)
      setEditingPrintId(null)
      onSaved()
    } catch (e) { setError(e.message) }
  }

  async function handleDeletePrint(id) {
    if (!window.confirm('Delete this print?')) return
    try {
      await api.deletePrint(id, adminToken)
      onSaved()
    } catch (e) { setError(e.message) }
  }

  // Populate form when artwork changes
  useEffect(() => {
    if (!artwork) return
    const cfMap = {}
    artwork.custom_fields?.forEach(f => { cfMap[f.field_id] = f.value || '' })
    setForm({
      title: artwork.title || '',
      medium: artwork.medium || '',
      size: artwork.size || '',
      price: artwork.price != null ? String(artwork.price) : '',
      date_created: artwork.date_created || '',
      current_location: artwork.current_location || '',
      description: artwork.description || '',
      is_available: artwork.is_available ?? 1,
      genres: artwork.genres?.map(g => g.id) || [],
      showings: artwork.showings ? JSON.parse(JSON.stringify(artwork.showings)) : [],
      awards: artwork.awards ? JSON.parse(JSON.stringify(artwork.awards)) : [],
      custom_values: cfMap,
    })
    setError(null)
  }, [artwork?.id])

  function handleImagePick(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      let image_key = artwork.image_key
      if (imageFile) {
        setUploading(true)
        const result = await api.uploadImage(imageFile, adminToken)
        image_key = result.key
        setUploading(false)
      }
      const payload = {
        ...form,
        price: form.price !== '' ? Number(form.price) : null,
        is_available: Number(form.is_available),
        image_key,
      }
      await api.updateArtwork(artwork.id, payload, adminToken)
      setEditing(false)
      setImageFile(null)
      setImagePreview(null)
      onSaved()
    } catch (e) {
      setUploading(false)
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function toggleGenre(id) {
    setForm(f => ({
      ...f,
      genres: f.genres.includes(id)
        ? f.genres.filter(x => x !== id)
        : [...f.genres, id]
    }))
  }

  if (!artwork) return null

  return (
    <div className={`metadata-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-handle-area" onClick={onToggle}>
        <div className="panel-handle" />
      </div>

      <div className="panel-content">
        <div className="panel-header">
          <div style={{ flex: 1 }}>
            {editing
              ? <input value={form.title} onChange={e => setField('title', e.target.value)} style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600 }} />
              : <div className="panel-title">{artwork.title}</div>
            }
            <div className="panel-artist">{artwork.artist_name}</div>
          </div>
          <div className="panel-actions">
            {isAdmin && !editing && (
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setEditing(true)}>
                ✏️ Edit
              </button>
            )}
            {editing && (
              <>
                <button className="btn btn-ghost" onClick={() => { setEditing(false); setError(null) }}>Cancel</button>
                <button className="btn btn-primary" disabled={saving || uploading} onClick={handleSave}>
                  {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Save'}
                </button>
              </>
            )}
            <button className="btn-icon" style={{ color: '#888', fontSize: 18 }} onClick={onClose}>✕</button>
          </div>
        </div>

        {error && <div style={{ color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {/* Tag chips — Medium, Subject, Style */}
        {!editing && artwork.genres?.length > 0 && (
          <div className="categories-row" style={{ flexWrap: 'wrap', gap: 6 }}>
            {artwork.genres.map(g => (
              <span key={g.id} className="cat-chip" style={{ background: g.color }}>{g.name}</span>
            ))}
          </div>
        )}

        {/* Core metadata fields */}
        {editing
          ? <EditForm
              form={form} setField={setField} toggleGenre={toggleGenre}
              artwork={artwork}
              imagePreview={imagePreview} onImagePick={handleImagePick}
            />
          : <ViewFields artwork={artwork} />
        }

        {/* Prints section (printable category only) */}
        {isPrintable && (
          <PrintsSection
            prints={prints}
            isAdmin={isAdmin}
            artwork={artwork}
            addingPrint={addingPrint}
            newPrint={newPrint}
            setNewPrint={setNewPrint}
            onStartAdd={() => setAddingPrint(true)}
            onCancelAdd={() => { setAddingPrint(false); setNewPrint({ ...BLANK_PRINT }) }}
            onAddPrint={handleAddPrint}
            editingPrintId={editingPrintId}
            editingPrint={editingPrint}
            onStartEdit={(p) => { setEditingPrintId(p.id); setEditingPrint({ ...p, price: p.price ?? '' }) }}
            onCancelEdit={() => setEditingPrintId(null)}
            onUpdatePrint={handleUpdatePrint}
            onDeletePrint={handleDeletePrint}
          />
        )}
      </div>
    </div>
  )
}

function ViewFields({ artwork }) {
  return (
    <>
      <div className="meta-grid">
        {artwork.medium && <MetaItem label="Medium"   value={artwork.medium} />}
        {artwork.size    && <MetaItem label="Size"     value={artwork.size} />}
        {artwork.price != null && <MetaItem label="Price" value={PRICE_FMT(artwork.price)} />}
        {artwork.date_created && <MetaItem label="Created" value={DATE_FMT(artwork.date_created)} />}
        {artwork.current_location && <MetaItem label="Location" value={artwork.current_location} />}
        <MetaItem label="Available" value={artwork.is_available ? 'Yes' : 'No'} />
      </div>

      {artwork.description && (
        <div className="meta-section">
          <div className="meta-section-title">Description</div>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>{artwork.description}</p>
        </div>
      )}

      {/* Custom fields */}
      {artwork.custom_fields?.some(f => f.value) && (
        <div className="meta-section">
          <div className="meta-section-title">Additional Details</div>
          <div className="meta-grid">
            {artwork.custom_fields.filter(f => f.value).map(f => (
              <MetaItem key={f.field_id} label={f.field_name} value={f.value} />
            ))}
          </div>
        </div>
      )}

      {/* Showings */}
      {artwork.showings?.length > 0 && (
        <div className="meta-section">
          <div className="meta-section-title">Showings & Exhibitions</div>
          {artwork.showings.map((s, i) => (
            <div key={i} className="showing-item">
              <strong>{s.venue}</strong>
              <span>
                {[s.location, s.start_date && formatDateRange(s.start_date, s.end_date)].filter(Boolean).join(' · ')}
              </span>
              {s.notes && <div style={{ marginTop: 2, fontSize: 12, color: '#555' }}>{s.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Awards */}
      {artwork.awards?.length > 0 && (
        <div className="meta-section">
          <div className="meta-section-title">Awards</div>
          {artwork.awards.map((a, i) => (
            <div key={i} className="award-item">
              <strong>{a.title}</strong>
              <span>{[a.organization, a.award_date].filter(Boolean).join(' · ')}</span>
              {a.notes && <div style={{ marginTop: 2, fontSize: 12, color: '#555' }}>{a.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function EditForm({ form, setField, toggleGenre, artwork, imagePreview, onImagePick }) {
  function addShowing() {
    setField('showings', [...form.showings, { venue: '', location: '', start_date: '', end_date: '', notes: '' }])
  }
  function removeShowing(i) {
    setField('showings', form.showings.filter((_, idx) => idx !== i))
  }
  function setShowing(i, k, v) {
    const arr = [...form.showings]; arr[i] = { ...arr[i], [k]: v }; setField('showings', arr)
  }
  function addAward() {
    setField('awards', [...form.awards, { title: '', organization: '', award_date: '', notes: '' }])
  }
  function removeAward(i) {
    setField('awards', form.awards.filter((_, idx) => idx !== i))
  }
  function setAward(i, k, v) {
    const arr = [...form.awards]; arr[i] = { ...arr[i], [k]: v }; setField('awards', arr)
  }

  const allGenres = artwork._allGenres || []

  // Build tag groups for display
  const tagGroups = ['medium', 'subject', 'style'].map(type => ({
    type,
    label: { medium: 'Medium', subject: 'Subject', style: 'Style' }[type],
    tags: allGenres.filter(g => g.tag_type === type),
  })).filter(g => g.tags.length > 0)

  return (
    <>
      {/* Image upload */}
      <div className="form-row" style={{ marginBottom: 16 }}>
        <label>Photo</label>
        <label className="image-upload-area">
          {imagePreview
            ? <img src={imagePreview} alt="preview" style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 4, objectFit: 'contain' }} />
            : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Click to choose a photo…</span>
          }
          <input type="file" accept="image/*" onChange={onImagePick} style={{ display: 'none' }} />
        </label>
      </div>

      <div className="form-row-2" style={{ marginBottom: 12 }}>
        <div className="form-row">
          <label>Medium</label>
          <input value={form.medium} onChange={e => setField('medium', e.target.value)} placeholder="Oil on canvas" />
        </div>
        <div className="form-row">
          <label>Size</label>
          <input value={form.size} onChange={e => setField('size', e.target.value)} placeholder='24" × 36"' />
        </div>
      </div>
      <div className="form-row-2" style={{ marginBottom: 12 }}>
        <div className="form-row">
          <label>Price ($)</label>
          <input type="number" value={form.price} onChange={e => setField('price', e.target.value)} placeholder="0" />
        </div>
        <div className="form-row">
          <label>Date Created</label>
          <input value={form.date_created} onChange={e => setField('date_created', e.target.value)} placeholder="2024" />
        </div>
      </div>
      <div className="form-row">
        <label>Current Location</label>
        <input value={form.current_location} onChange={e => setField('current_location', e.target.value)} placeholder="Studio, gallery name…" />
      </div>
      <div className="form-row">
        <label>Available for Sale</label>
        <select value={form.is_available} onChange={e => setField('is_available', Number(e.target.value))}>
          <option value={1}>Yes</option>
          <option value={0}>No</option>
        </select>
      </div>
      <div className="form-row">
        <label>Description</label>
        <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={3} />
      </div>

      {/* Medium / Subject / Style tag pickers */}
      {tagGroups.map(group => (
        <div key={group.type} className="form-row">
          <label>
            {group.label}
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}> (optional)</span>
          </label>
          <div className="cat-checkbox-grid">
            {group.tags.map(g => (
              <label key={g.id}
                className={`cat-checkbox-item ${form.genres.includes(g.id) ? 'selected' : ''}`}
                style={{ color: g.color }}
              >
                <input type="checkbox" checked={form.genres.includes(g.id)}
                  onChange={() => toggleGenre(g.id)} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                {g.name}
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Custom fields */}
      {artwork.custom_fields?.length > 0 && (
        <div className="form-row">
          <label>Additional Details</label>
          {artwork.custom_fields.map(f => (
            <div key={f.field_id} style={{ marginBottom: 8 }}>
              <label>{f.field_name}</label>
              <input
                type={f.field_type === 'number' ? 'number' : f.field_type === 'date' ? 'date' : 'text'}
                value={form.custom_values?.[f.field_id] || ''}
                onChange={e => setField('custom_values', { ...form.custom_values, [f.field_id]: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}

      {/* Showings */}
      <div className="meta-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="meta-section-title" style={{ border: 'none', padding: 0, margin: 0 }}>Showings</div>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={addShowing}>+ Add</button>
        </div>
        {form.showings.map((s, i) => (
          <div key={i} className="sub-list-item">
            <button className="remove-btn" onClick={() => removeShowing(i)}>✕</button>
            <input placeholder="Venue *" value={s.venue} onChange={e => setShowing(i, 'venue', e.target.value)} style={{ marginBottom: 6 }} />
            <div className="form-row-2">
              <input placeholder="Location" value={s.location} onChange={e => setShowing(i, 'location', e.target.value)} />
              <input type="date" placeholder="Start" value={s.start_date} onChange={e => setShowing(i, 'start_date', e.target.value)} />
            </div>
            <input placeholder="Notes" value={s.notes} onChange={e => setShowing(i, 'notes', e.target.value)} style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>

      {/* Awards */}
      <div className="meta-section" style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="meta-section-title" style={{ border: 'none', padding: 0, margin: 0 }}>Awards</div>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={addAward}>+ Add</button>
        </div>
        {form.awards.map((a, i) => (
          <div key={i} className="sub-list-item">
            <button className="remove-btn" onClick={() => removeAward(i)}>✕</button>
            <input placeholder="Award title *" value={a.title} onChange={e => setAward(i, 'title', e.target.value)} style={{ marginBottom: 6 }} />
            <div className="form-row-2">
              <input placeholder="Organization" value={a.organization} onChange={e => setAward(i, 'organization', e.target.value)} />
              <input type="date" value={a.award_date} onChange={e => setAward(i, 'award_date', e.target.value)} />
            </div>
            <input placeholder="Notes" value={a.notes} onChange={e => setAward(i, 'notes', e.target.value)} style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>
    </>
  )
}

function MetaItem({ label, value }) {
  return (
    <div className="meta-item">
      <label>{label}</label>
      <div className="meta-value">{value}</div>
    </div>
  )
}

function formatDateRange(start, end) {
  if (!start) return ''
  if (!end || start === end) return start
  return `${start} – ${end}`
}

function PrintForm({ print, setPrint, onSave, onCancel, saveLabel = 'Add Print' }) {
  return (
    <div className="sub-list-item" style={{ marginTop: 8 }}>
      <div className="form-row-2">
        <div className="form-row">
          <label>Size</label>
          <input placeholder='e.g. 16"×20"' value={print.size} onChange={e => setPrint(p => ({ ...p, size: e.target.value }))} />
        </div>
        <div className="form-row">
          <label>Medium</label>
          <select value={print.medium} onChange={e => setPrint(p => ({ ...p, medium: e.target.value }))}>
            {PRINT_MEDIUMS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label>Price ($)</label>
          <input type="number" placeholder="0" value={print.price} onChange={e => setPrint(p => ({ ...p, price: e.target.value }))} />
        </div>
        <div className="form-row">
          <label>Status</label>
          <select value={print.is_available} onChange={e => setPrint(p => ({ ...p, is_available: Number(e.target.value) }))}>
            <option value={1}>Available</option>
            <option value={0}>Sold / Unavailable</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <label>Current Location</label>
        <input placeholder="Studio, gallery…" value={print.current_location} onChange={e => setPrint(p => ({ ...p, current_location: e.target.value }))} />
      </div>
      <div className="form-row">
        <label>Sold To</label>
        <input placeholder="Customer name" value={print.sold_to} onChange={e => setPrint(p => ({ ...p, sold_to: e.target.value }))} />
      </div>
      <div className="form-row">
        <label>Notes</label>
        <input placeholder="Optional notes" value={print.notes} onChange={e => setPrint(p => ({ ...p, notes: e.target.value }))} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" style={{ fontSize: 12, padding: '5px 14px' }} onClick={onSave}>{saveLabel}</button>
        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 14px' }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function PrintsSection({
  prints, isAdmin, artwork,
  addingPrint, newPrint, setNewPrint, onStartAdd, onCancelAdd, onAddPrint,
  editingPrintId, editingPrint, onStartEdit, onCancelEdit, onUpdatePrint, onDeletePrint
}) {
  const available = prints.filter(p => p.is_available).length
  return (
    <div className="meta-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="meta-section-title" style={{ border: 'none', padding: 0, margin: 0 }}>
          Prints
          {prints.length > 0 && (
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
              {available} of {prints.length} available
            </span>
          )}
        </div>
        {isAdmin && !addingPrint && (
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={onStartAdd}>+ Add Print</button>
        )}
      </div>

      {addingPrint && (
        <PrintForm print={newPrint} setPrint={setNewPrint} onSave={onAddPrint} onCancel={onCancelAdd} saveLabel="Add Print" />
      )}

      {prints.length === 0 && !addingPrint && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No prints recorded yet.</p>
      )}

      {prints.map(p => (
        editingPrintId === p.id
          ? <PrintForm key={p.id} print={editingPrint} setPrint={fn => onStartEdit(typeof fn === 'function' ? fn(editingPrint) : fn)}
              onSave={() => onUpdatePrint(p.id)} onCancel={onCancelEdit} saveLabel="Save" />
          : (
            <div key={p.id} className="print-item">
              <div className="print-item-header">
                <div>
                  <strong>{[p.size, p.medium].filter(Boolean).join(' · ')}</strong>
                  {p.price != null && <span style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 600 }}>${Number(p.price).toLocaleString()}</span>}
                  <span className={`print-status ${p.is_available ? 'available' : 'sold'}`}>
                    {p.is_available ? 'Available' : 'Sold'}
                  </span>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 8px' }}
                      onClick={() => onStartEdit(p)}>Edit</button>
                    <button className="btn btn-danger" style={{ fontSize: 11, padding: '2px 8px' }}
                      onClick={() => onDeletePrint(p.id)}>✕</button>
                  </div>
                )}
              </div>
              {p.current_location && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {p.current_location}</div>}
              {p.sold_to && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sold to: {p.sold_to}</div>}
              {p.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{p.notes}</div>}
            </div>
          )
      ))}
    </div>
  )
}
