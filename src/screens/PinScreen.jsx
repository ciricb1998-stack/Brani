import { useState, useEffect } from 'react'
import { useApp } from '../App.jsx'
import { loadData, saveData } from '../utils/storage.js'

const PIN_KEY = 'pin_hash'
const DEFAULT_PIN = '1998'

function hashPin(pin) {
  let h = 0
  for (let i = 0; i < pin.length; i++) {
    h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0
  }
  return h.toString(36)
}

function getSavedHash() { return loadData(PIN_KEY, hashPin(DEFAULT_PIN)) }

export function savePIN(pin) { saveData(PIN_KEY, hashPin(pin)) }
export function checkPIN(pin) { return hashPin(pin) === getSavedHash() }

export default function PinScreen({ onUnlock }) {
  const { t } = useApp()
  const [digits, setDigits] = useState([])
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (digits.length === 4) {
      if (checkPIN(digits.join(''))) {
        localStorage.setItem('brani_unlocked', '1')
        onUnlock()
      } else {
        setShake(true)
        setError(true)
        setTimeout(() => {
          setDigits([])
          setError(false)
          setShake(false)
        }, 600)
      }
    }
  }, [digits])

  function press(d) {
    if (digits.length < 4) setDigits(p => [...p, d])
  }

  function del() {
    setDigits(p => p.slice(0, -1))
  }

  const KEYS = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    [null,'0','del']
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      userSelect: 'none',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: 'linear-gradient(145deg, #111827, #06080d)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <img src="/icon-192.png" alt="BRANI" style={{ width: 72, height: 72, borderRadius: 18 }} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '2px' }}>BRANI SYSTEM</div>
        <div style={{ fontSize: 12, color: 'var(--text-dimmer)', marginTop: 4, letterSpacing: '1px' }}>{t.enter_pin}</div>
      </div>

      {/* Dots */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 40,
        animation: shake ? 'pinShake 0.5s ease' : 'none'
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%',
            background: digits[i] !== undefined
              ? (error ? 'var(--red)' : 'var(--accent)')
              : 'transparent',
            border: `2px solid ${digits[i] !== undefined ? (error ? 'var(--red)' : 'var(--accent)') : 'rgba(255,255,255,0.2)'}`,
            transition: 'all 0.15s',
          }} />
        ))}
      </div>

      {/* Keypad */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {KEYS.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 12 }}>
            {row.map((key, ki) => {
              if (!key) return <div key={ki} style={{ width: 72, height: 72 }} />
              return (
                <button
                  key={ki}
                  onClick={() => key === 'del' ? del() : press(key)}
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: key === 'del' ? 'transparent' : 'var(--card)',
                    border: key === 'del' ? 'none' : '0.5px solid var(--card-border)',
                    color: 'var(--text)',
                    fontSize: key === 'del' ? 20 : 22,
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onPointerDown={e => e.currentTarget.style.background = key === 'del' ? 'transparent' : 'var(--card-hover)'}
                  onPointerUp={e => e.currentTarget.style.background = key === 'del' ? 'transparent' : 'var(--card)'}
                >
                  {key === 'del' ? '⌫' : key}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pinShake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
