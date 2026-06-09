import { useState } from 'react'
import { supabase } from '../utils/supabase.js'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minuta

function getLockout() {
  try {
    const raw = localStorage.getItem('brani_auth_lock')
    if (!raw) return null
    const { until, count } = JSON.parse(raw)
    return { until, count }
  } catch { return null }
}

function setLockout(count) {
  const until = count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : null
  localStorage.setItem('brani_auth_lock', JSON.stringify({ until, count }))
}

function clearLockout() {
  localStorage.removeItem('brani_auth_lock')
}

function getRemainingMinutes(until) {
  return Math.ceil((until - Date.now()) / 60000)
}

export default function AuthScreen({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function getBlockStatus() {
    const lock = getLockout()
    if (!lock) return { blocked: false, count: 0 }
    if (lock.until && Date.now() < lock.until) {
      return { blocked: true, minutes: getRemainingMinutes(lock.until), count: lock.count }
    }
    if (lock.until && Date.now() >= lock.until) {
      clearLockout()
    }
    return { blocked: false, count: lock.count || 0 }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')

    const status = getBlockStatus()
    if (status.blocked) {
      setError(`Previše pogrešnih pokušaja. Pokušaj ponovo za ${status.minutes} min.`)
      return
    }

    setLoading(true)
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      const newCount = (status.count || 0) + 1
      setLockout(newCount)
      const remaining = MAX_ATTEMPTS - newCount
      if (newCount >= MAX_ATTEMPTS) {
        setError(`Previše pogrešnih pokušaja. Account zaključan na 15 minuta.`)
      } else {
        setError(`Pogrešan email ili lozinka. Ostalo pokušaja: ${remaining}`)
      }
    } else {
      clearLockout()
      onAuth(data.user)
    }
    setLoading(false)
  }

  const blockStatus = getBlockStatus()

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 30% 20%, #0d1929 0%, #06080c 60%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      fontFamily: "'Outfit', -apple-system, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 68, height: 68,
            background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
            border: '1px solid rgba(59,130,246,0.35)',
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
            boxShadow: '0 0 60px rgba(59,130,246,0.18), 0 0 120px rgba(59,130,246,0.06)',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 32, height: 32 }}>
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.5px', marginBottom: 4 }}>
            BRANI SYSTEM
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Privatni pristup · Samo za vlasnika
          </div>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'rgba(255,255,255,0.028)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 22,
          padding: '30px 26px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          {/* Lock icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Sigurna prijava</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Supabase Auth · End-to-end zaštita</div>
            </div>
          </div>

          {blockStatus.blocked ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fca5a5', marginBottom: 8 }}>Account privremeno zaključan</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                Previše pogrešnih pokušaja.<br />
                Pokušaj ponovo za <strong style={{ color: '#f1f5f9' }}>{blockStatus.minutes} minuta</strong>.
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', marginBottom: 6 }}>EMAIL</div>
                <input
                  type="email"
                  placeholder="tvoj@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  required
                  autoComplete="email"
                  style={{
                    display: 'block', width: '100%', boxSizing: 'border-box',
                    padding: '13px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 12,
                    color: '#f1f5f9', fontSize: 15, fontFamily: 'inherit',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                />
              </div>

              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', marginBottom: 6 }}>LOZINKA</div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  required
                  autoComplete="current-password"
                  style={{
                    display: 'block', width: '100%', boxSizing: 'border-box',
                    padding: '13px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 12,
                    color: '#f1f5f9', fontSize: 15, fontFamily: 'inherit',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                />
              </div>

              {error && (
                <div style={{
                  margin: '12px 0',
                  padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 10,
                  fontSize: 13, color: '#fca5a5', lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', marginTop: 18,
                  background: loading ? 'rgba(59,130,246,0.25)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none', borderRadius: 12,
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  fontFamily: 'inherit', cursor: loading ? 'wait' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 24px rgba(59,130,246,0.35)',
                  transition: 'all 0.2s', letterSpacing: '0.2px',
                }}
              >
                {loading ? 'Provjera...' : 'Prijavi se →'}
              </button>
            </form>
          )}
        </div>

        {/* Security info */}
        <div style={{ marginTop: 16, display: 'flex', gap: 16, justifyContent: 'center' }}>
          {['🔒 Supabase Auth', '📍 PIN zaštita', '🛡️ RLS enkriptija'].map(label => (
            <div key={label} style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3px' }}>{label}</div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.1)' }}>
          BRANI SYSTEM · Privatna upotreba
        </div>
      </div>
    </div>
  )
}
