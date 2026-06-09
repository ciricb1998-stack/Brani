import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false }
  }

  static getDerivedStateFromError() {
    return { crashed: true }
  }

  componentDidCatch(error, info) {
    console.error('[BRANI] Crash:', error, info)
  }

  reload() {
    // Clear potentially corrupted state then reload
    try { sessionStorage.removeItem('brani_unlocked') } catch {}
    window.location.reload()
  }

  hardReset() {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {}
    window.location.reload()
  }

  render() {
    if (!this.state.crashed) return this.props.children

    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#06080c',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Outfit', -apple-system, sans-serif",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'linear-gradient(145deg, #111827, #06080d)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <img src="/icon-192.png" alt="BRANI" style={{ width: 56, height: 56, borderRadius: 14 }} />
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: '#dfe4ea', marginBottom: 8, textAlign: 'center' }}>
          BRANI SYSTEM
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 32, textAlign: 'center', lineHeight: 1.5 }}>
          Došlo je do greške. Pokušaj ponovo.
        </div>

        <button
          onClick={() => this.reload()}
          style={{
            width: '100%', maxWidth: 280,
            padding: '14px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: 'none', borderRadius: 12,
            color: 'white', fontFamily: 'inherit',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            marginBottom: 10,
          }}
        >
          Osvježi aplikaciju
        </button>

        <button
          onClick={() => this.hardReset()}
          style={{
            width: '100%', maxWidth: 280,
            padding: '12px',
            background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            color: 'rgba(255,255,255,0.35)', fontFamily: 'inherit',
            fontSize: 13, cursor: 'pointer',
          }}
        >
          Reset podataka (zadnji korak)
        </button>
      </div>
    )
  }
}
