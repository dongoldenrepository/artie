import { useRef, useEffect } from 'react'

// A few sensible defaults so the artist usually doesn't need the custom
// picker at all — merged with colors already used elsewhere in the catalog.
const DEFAULT_SWATCHES = ['#ffffff', '#000000', '#f5f0e6', '#1a1a1a', '#e8e4dc']

export default function BackgroundColorPicker({ value, swatches = [], onChange, onClose, style }) {
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const options = [...new Set([...swatches, ...DEFAULT_SWATCHES])]

  return (
    <div ref={ref} className="bg-color-popover" style={style} onClick={e => e.stopPropagation()}>
      <div className="bg-color-popover-label">Background</div>

      <button
        className={`bg-color-swatch checkerboard-bg${value == null ? ' selected' : ''}`}
        title="Default (transparent checkerboard)"
        onClick={() => onChange(null)}
      />

      {options.map(c => (
        <button
          key={c}
          className={`bg-color-swatch${value === c ? ' selected' : ''}`}
          style={{ background: c }}
          title={c}
          onClick={() => onChange(c)}
        />
      ))}

      <label className="bg-color-swatch bg-color-custom" title="Custom color…">
        🎨
        <input
          type="color"
          value={value || '#ffffff'}
          onChange={e => onChange(e.target.value)}
        />
      </label>
    </div>
  )
}
