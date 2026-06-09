import { useApp } from '../App.jsx'
import { BRANDS } from '../data/brands.js'

export default function ScreenHeader({ label, title, sub, action }) {
  const { settings } = useApp()
  const accent = (BRANDS[settings.brand] || BRANDS.brani).primary

  return (
    <div style={{ padding: '4px 0 22px' }}>
      {label && (
        <div style={{
          fontSize: 9, fontWeight: 700, color: accent,
          letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 6,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{ width: 16, height: 1.5, background: accent, borderRadius: 1 }} />
          {label}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{
            fontSize: 28, fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.8px', lineHeight: 1.1, marginBottom: sub ? 5 : 0,
          }}>
            {title}
          </div>
          {sub && (
            <div style={{ fontSize: 12, color: '#333', fontWeight: 500 }}>{sub}</div>
          )}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
    </div>
  )
}
