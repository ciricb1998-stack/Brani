// Central icon registry — all SVGs white stroke, viewBox 0 0 24 24
const S = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
const sz = n => ({ width: n, height: n })

export const ICON_DEFS = {
  morning:    (n=20) => <svg {...S} style={sz(n)}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  workout:    (n=20) => <svg {...S} style={sz(n)}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  meditation: (n=20) => <svg {...S} style={sz(n)}><path d="M12 2a9 9 0 0 1 9 9c0 3.87-2.44 7.16-6 8.48V21h-6v-1.52C5.44 18.16 3 14.87 3 11a9 9 0 0 1 9-9z"/><circle cx="12" cy="11" r="2" fill="currentColor" stroke="none"/></svg>,
  reading:    (n=20) => <svg {...S} style={sz(n)}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  shower:     (n=20) => <svg {...S} style={sz(n)}><path d="M4 4h3a2 2 0 0 1 2 2v3.5h0a5.5 5.5 0 0 1 11 0V20"/><line x1="16" y1="16" x2="16" y2="21"/><line x1="20" y1="16" x2="20" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/></svg>,
  vitamins:   (n=20) => <svg {...S} style={sz(n)}><path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"/><circle cx="18" cy="18" r="4"/><path d="m15.3 15.3 5.4 5.4"/></svg>,
  walk:       (n=20) => <svg {...S} style={sz(n)}><circle cx="13" cy="4" r="2"/><path d="M10.7 8.7 8 22"/><path d="M16 22 13.8 16l-2.8-3L13 8"/><path d="M7 12l-2 1-3 2.5"/></svg>,
  run:        (n=20) => <svg {...S} style={sz(n)}><circle cx="13" cy="4" r="2"/><path d="M6 20l4-6 3 3 2-4"/><path d="m6 7 4 1 4-3 3 2"/><line x1="22" y1="12" x2="14" y2="12"/></svg>,
  coffee:     (n=20) => <svg {...S} style={sz(n)}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  water:      (n=20) => <svg {...S} style={sz(n)}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  writing:    (n=20) => <svg {...S} style={sz(n)}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  goal:       (n=20) => <svg {...S} style={sz(n)}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  sleep:      (n=20) => <svg {...S} style={sz(n)}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  food:       (n=20) => <svg {...S} style={sz(n)}><path d="M11 2a10 10 0 1 0 10 10"/><path d="M11 2a10 10 0 0 1 10 10"/><path d="M11 2v10h10"/></svg>,
  pray:       (n=20) => <svg {...S} style={sz(n)}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
  music:      (n=20) => <svg {...S} style={sz(n)}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  brain:      (n=20) => <svg {...S} style={sz(n)}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>,
  // Section icons
  business:   (n=20) => <svg {...S} style={sz(n)}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  football:   (n=20) => <svg {...S} style={sz(n)}><circle cx="12" cy="12" r="10"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  health:     (n=20) => <svg {...S} style={sz(n)}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  personal:   (n=20) => <svg {...S} style={sz(n)}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  // Meeting types
  call:       (n=20) => <svg {...S} style={sz(n)}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  video:      (n=20) => <svg {...S} style={sz(n)}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  onsite:     (n=20) => <svg {...S} style={sz(n)}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  other:      (n=20) => <svg {...S} style={sz(n)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  // Habits extras
  vitamins2:  (n=20) => <svg {...S} style={sz(n)}><path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"/><circle cx="18" cy="18" r="4"/><path d="m15.3 15.3 5.4 5.4"/></svg>,
}

// Icon IDs available for picker
export const PICKER_ICONS = [
  'morning','workout','meditation','reading','shower','vitamins',
  'walk','run','coffee','water','writing','goal',
  'sleep','food','music','brain','health','personal'
]

// Render icon by ID, fallback to text if not found (backward compat with emoji)
export function Icon({ id, size = 20, color = 'currentColor' }) {
  const fn = ICON_DEFS[id]
  if (!fn) return <span style={{ fontSize: size * 0.8, lineHeight: 1 }}>{id}</span>
  return <span style={{ display: 'inline-flex', alignItems: 'center', color }}>{fn(size)}</span>
}

// Square icon block — like card-icon but standalone
export function IconBlock({ id, size = 34, bg = 'var(--accent-icon-bg)', color = 'var(--accent)', radius = 9 }) {
  const fn = ICON_DEFS[id]
  return (
    <div style={{ width: size, height: size, background: bg, borderRadius: radius, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
      {fn ? fn(Math.round(size * 0.52)) : <span style={{ fontSize: size * 0.44 }}>{id}</span>}
    </div>
  )
}

// Pillar accent colors
export const PILLAR_COLORS = {
  business: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.2)' },
  football: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.2)'  },
  health:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.2)'  },
  personal: { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.2)' },
}
