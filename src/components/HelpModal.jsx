export default function HelpModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2>Getting Started</h2>
          <button className="btn-icon" style={{ fontSize: 20, color: '#888' }} onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', fontSize: 14, lineHeight: 1.7 }}>

          <Section title="The Main Screen">
            <p>Your catalog opens as a grid of thumbnail images. At the top:</p>
            <ul>
              <li><b>Your name</b> appears in the upper left as the catalog title.</li>
              <li>The <b>search bar</b> searches by title by default — click <b>All Fields</b> to search across all details.</li>
              <li>The <b>Admin</b> button is in the upper right — see below.</li>
            </ul>
            <p>The <b>filter bar</b> below the header shows colored chips for tags in use in your catalog. Click any chip to filter the grid; click <b>All</b> to clear the filter. You'll also see a piece count and a <b>Sort</b> toggle to switch between alphabetical and your custom manual order.</p>
          </Section>

          <Section title="Viewing a Piece">
            <p>Click any thumbnail to open it full-screen.</p>
            <ul>
              <li>The <b>‹ ›</b> arrows (or keyboard ← →) step through your catalog.</li>
              <li><b>Escape</b> (or the ✕) closes and returns to the grid.</li>
              <li>If a piece has multiple images, a thumbnail strip appears below — click any to switch views.</li>
              <li><b>▲ Show Details</b> at the bottom (or press <b>i</b>) slides up the metadata panel with all details for that piece.</li>
            </ul>
          </Section>

          <Section title="Admin Mode">
            <p>Click <b>Admin</b> in the upper right and enter your password to unlock editing.</p>
            <p>Once logged in, the admin toolbar appears with:</p>
            <ul>
              <li><b>+ Add Artwork</b> — add a new piece with details and an image.</li>
              <li><b>📷 Add Photo</b> — quick upload shortcut.</li>
              <li><b>⚙ Catalog Settings</b> — manage your Medium, Subject, and Style tags.</li>
              <li><b>🔑 Change Password</b> — update your admin password.</li>
              <li><b>Log out</b> — end your admin session.</li>
            </ul>
            <p>In admin mode you can also <b>drag and drop</b> pieces in the grid to set your preferred order.</p>
          </Section>

          <Section title="Catalog Settings — Configuring Your Tags">
            <p>Artie organizes artwork with three types of tags: <b>Medium</b> (what it's made with), <b>Subject</b> (what's depicted), and <b>Style</b> (the aesthetic approach). Your catalog comes pre-loaded with options — only the ones you enable appear as filter chips.</p>
            <p>Click <b>⚙ Catalog Settings</b> to manage them. Each section shows:</p>
            <ul>
              <li><b>Enabled tags</b> — listed at the top with a Disable button. Disabling hides a tag from the filter bar but keeps it on any artwork already tagged with it.</li>
              <li><b>Disabled tags</b> — shown faded below with an Enable button.</li>
              <li><b>Add a new tag</b> — type a name, pick a color, click Add.</li>
            </ul>
            <p>At the bottom of Catalog Settings you can also add <b>Custom Metadata Fields</b> for anything not covered by the standard fields — Provenance, Series, Commission details, etc. Choose a name and type (Text, Number, Date, or URL).</p>
          </Section>

          <Section title="Editing Artwork Details">
            <p>In admin mode, open a piece, show the details panel, then click <b>✏️ Edit</b>.</p>
            <p>From here you can update: photo, medium, size, price, date created, current location, availability, description, subject/style tags, custom fields, display history, and additional views (detail shots, alternate angles).</p>
            <p>Each display history entry follows the format: <i>Gallery Name · City · Date · Award or Note</i> — but it's freeform.</p>
            <p>Click <b>Save</b> when done, or <b>Cancel</b> to discard changes.</p>
            <Note>If a piece is tagged with Photography, Digital Creation, or Printmaking as its medium, a <b>Prints</b> section appears for tracking print editions — size, substrate, price, and availability.</Note>
          </Section>

          <Section title="A Few Tips" last>
            <ul>
              <li>The filter bar only shows tags that are assigned to at least one artwork.</li>
              <li>Search and tag filters work together — you can do both at once.</li>
              <li>Drag-and-drop order is saved automatically and becomes your Manual sort.</li>
              <li>Multiple images (Additional Views) are great for framed vs. unframed shots or installation photos.</li>
            </ul>
          </Section>

        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function Note({ children }) {
  return (
    <div style={{
      marginTop: 10, padding: '8px 12px', borderRadius: 6,
      background: 'var(--bg)', border: '1px solid var(--border)',
      fontSize: 13, color: 'var(--text-muted)'
    }}>
      {children}
    </div>
  )
}
