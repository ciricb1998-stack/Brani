import { useApp } from '../App.jsx'

const BRANDS = [
  { id: 'brani', label: 'BRANI', home: 'home', color: '#3B82F6' },
  { id: 'log', label: 'LOG', home: 'log_home', color: '#A855F7' },
  { id: 'branip', label: 'BDL', home: 'bdl_home', color: '#2563EB' },
]

export default function BrandSwitcher() {
  const { settings, updateSettings, setScreen } = useApp()

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {BRANDS.map(b => {
        const isActive = settings.brand === b.id
        return (
          <button
            key={b.id}
            onClick={() => { if (!isActive) { updateSettings({ brand: b.id }); setScreen(b.home) } }}
            style={{
              padding: '4px 10px', borderRadius: 7,
              border: `1px solid ${isActive ? b.color : 'var(--card-border)'}`,
              background: isActive ? `${b.color}22` : 'transparent',
              color: isActive ? b.color : 'var(--text-dimmer)',
              fontSize: 10, fontWeight: isActive ? 700 : 500,
              letterSpacing: '0.8px', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >{b.label}</button>
        )
      })}
    </div>
  )
}
