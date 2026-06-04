import { useState, useEffect } from 'react'
import { api } from '../utils/api'

const PRESET_COLORS = [
  '#ef4444','#f97316','#f59e0b','#22c55e','#06b6d4',
  '#3b82f6','#8b5cf6','#ec4899','#6b7280','#78716c'
]

const TAG_SECTIONS = [
  {
    key: 'medium',
    label: 'Medium',
    description: 'What material or process — Oil, Acrylic, Watercolor, Photography, etc.',
    placeholder: 'e.g. Gouache, Ink, Encaustic',
    defaultColor: '#3b82f6',
  },
  {
    key: 'subject',
    label: 'Subject',
    description: 'What is depicted — Portrait, Landscape, Wildlife, Street, etc.',
    placeholder: 'e.g. Floral, Seascape, Architecture',
    defaultColor: '#6b7280',
  },
  {
    key: 'style',
    label: 'Style',
    description: 'Aesthetic approach or movement — Impressionism, Realism, Abstract, etc.',
    placeholder: 'e.g. Surrealism, Minimalism, Art Nouveau',
    defaultColor: '#8b5cf6',
  },
]

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
      {PRESET_COLORS.map(c => (
        <button key={c}
          style={{
            width: 20, height: 20, borderRadius: '50%', background: c,
            border: value === c ? '3px solid white' : '2px solid transparent',
            outline: value === c ? '2px solid #1a1a1a' : 'none',
            cursor: 'pointer', padding: 0, flexShrink: 0
          }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  )
}

export default function CategoryManager({ customFields = [], artistId, adminToken, onClose, onSaved }) {
  // Load all genres including disabled ones for management
  const [allGenres, setAllGenres] = useState([])

  useEffect(() => {
    api.getAllGenres({ artist_id: artistId })
      .then(r => setAllGenres(r.genres || []))
      .catch(() => {})
  }, [artistId])

  function reloadGenres() {
    api.getAllGenres({ artist_id: artistId })
      .then(r => setAllGenres(r.genres || []))
      .catch(() => {})
    onSaved()
  }

  // New tag form per section (keyed by tag_type)
  const [newTag, setNewTag] = useState({
    medium:  { name: '', color: '#3b82f6' },
    subject: { name: '', color: '#6b7280' },
    style:   { name: '', color: '#8b5cf6' },
  })

  const [newField, setNewField] = useState({ name: '', field_type: 'text' })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)

  async function addTag(tagType) {
    const tag = newTag[tagType]
    if (!tag.name.trim()) { setError(`${tagType} name is required`); return }
    setSaving(true); setError(null)
    try {
      await api.createGenre({ name: tag.name.trim(), color: tag.color, artist_id: artistId, tag_type: tagType }, adminToken)
      setNewTag(prev => ({ ...prev, [tagType]: { ...prev[tagType], name: '' } }))
      reloadGenres()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function toggleTag(id, currentlyEnabled) {
    try {
      await api.toggleGenre(id, !currentlyEnabled, adminToken)
      reloadGenres()
    } catch (e) { setError(e.message) }
  }

  async function addField() {
    if (!newField.name.trim()) { setError('Field name is required'); return }
    setSaving(true); setError(null)
    try {
      await api.createCustomField({ ...newField, artist_id: artistId }, adminToken)
      setNewField({ name: '', field_type: 'text' })
      onSaved()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function deleteField(id) {
    if (!window.confirm('Delete this field? Values will be lost for all artworks.')) return
    try {
      await api.deleteCustomField(id, adminToken); onSaved()
    } catch (e) { setError(e.message) }
  }

  const divider = <hr style={{ margin: '24px 0', borderColor: 'var(--border)' }} />

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h2>Tags &amp; Fields</h2>
          <button className="btn-icon" style={{ fontSize: 20, color: '#888' }} onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div style={{ color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>{error}</div>}



          {divider}

          {/* ── Medium / Subject / Style sections ── */}
          {TAG_SECTIONS.map((section, idx) => {
            const tags = allGenres.filter(g => g.tag_type === section.key)
            const enabled = tags.filter(t => t.enabled)
            const disabled = tags.filter(t => !t.enabled)
            const form = newTag[section.key]
            return (
              <div key={section.key}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{section.label}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{section.description}</p>

                {tags.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 8 }}>
                    No {section.label.toLowerCase()} tags yet.
                  </p>
                )}

                {enabled.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}
                      onClick={() => toggleTag(t.id, true)}>Disable</button>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 14 }}>{t.name}</span>
                  </div>
                ))}

                {disabled.length > 0 && (
                  <div style={{ marginTop: disabled.length ? 8 : 0, paddingTop: 6, borderTop: '1px dashed var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disabled</div>
                    {disabled.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, opacity: 0.5 }}>
                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12, flexShrink: 0 }}
                          onClick={() => toggleTag(t.id, false)}>Enable</button>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 14 }}>{t.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label>New {section.label}</label>
                    <input
                      value={form.name}
                      onChange={e => setNewTag(prev => ({ ...prev, [section.key]: { ...prev[section.key], name: e.target.value } }))}
                      placeholder={section.placeholder}
                      onKeyDown={e => e.key === 'Enter' && addTag(section.key)}
                    />
                  </div>
                  <div>
                    <label>Color</label>
                    <ColorPicker
                      value={form.color}
                      onChange={c => setNewTag(prev => ({ ...prev, [section.key]: { ...prev[section.key], color: c } }))}
                    />
                  </div>
                  <button className="btn btn-primary" disabled={saving} onClick={() => addTag(section.key)}
                    style={{ flexShrink: 0, alignSelf: 'flex-end' }}>
                    Add
                  </button>
                </div>

                {divider}
              </div>
            )
          })}

          {/* ── Custom Fields ── */}
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Custom Metadata Fields</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Add extra fields beyond the standard ones (title, size, medium, etc.)
          </p>

          {customFields.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ flex: 1, fontSize: 14 }}>{f.name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 4 }}>
                {f.field_type}
              </span>
              <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}
                onClick={() => deleteField(f.id)}>Remove</button>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <label>Field Name</label>
              <input
                value={newField.name}
                onChange={e => setNewField(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Provenance, Series, Commission"
                onKeyDown={e => e.key === 'Enter' && addField()}
              />
            </div>
            <div style={{ width: 110 }}>
              <label>Type</label>
              <select value={newField.field_type} onChange={e => setNewField(f => ({ ...f, field_type: e.target.value }))}>
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="url">URL</option>
              </select>
            </div>
            <button className="btn btn-primary" disabled={saving} onClick={addField}
              style={{ flexShrink: 0, alignSelf: 'flex-end' }}>
              Add
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
