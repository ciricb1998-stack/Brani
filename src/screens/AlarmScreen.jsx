import { useState, useEffect, useRef } from 'react'
import { useApp } from '../App.jsx'
import { BRANDS } from '../data/brands.js'
import { loadAlarm, saveAlarm, fetchElevenLabsVoices, previewVoice } from '../utils/alarm.js'

const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const DEFAULT_TEXT = 'Steh auf! Du hast eine Mission. Heute ist der Tag, an dem du Geschichte schreibst. Kein Aufgeben. Du bist stärker als jede Ausrede. Jetzt aufstehen!'
const DEFAULT_ALARM = {
  enabled: false,
  time: '07:00',
  days: [1, 2, 3, 4, 5],
  voiceId: '',
  voiceName: '',
  text: DEFAULT_TEXT,
}

export default function AlarmScreen() {
  const { settings } = useApp()
  const accent = (BRANDS[settings.brand] || BRANDS.brani).primary

  const [alarm, setAlarm]       = useState(() => loadAlarm() || DEFAULT_ALARM)
  const [voices, setVoices]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [voiceError, setVoiceError] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')
  const [saved, setSaved]       = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [playingId, setPlayingId] = useState(null)
  const [nightMode, setNightMode] = useState(false)
  const currentAudio = useRef(null)
  const silentAudio = useRef(null)
  const [clock, setClock]       = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const key = localStorage.getItem('brani_elevenlabs_key')
    const parsed = key ? (() => { try { return JSON.parse(key) } catch { return key } })() : ''
    if (!parsed) {
      setVoiceError('Kein API Key. Bitte in Profil → ElevenLabs eintragen.')
      setLoading(false)
      return
    }
    fetchElevenLabsVoices()
      .then(({ voices, error }) => {
        if (error) setVoiceError(`Fehler: ${error}`)
        else if (!voices.length) setVoiceError('Keine Stimmen gefunden.')
        setVoices(voices)
        setLoading(false)
      })
      .catch(e => { setVoiceError(`Verbindungsfehler: ${e.message}`); setLoading(false) })
  }, [])

  function update(patch) { setAlarm(prev => ({ ...prev, ...patch })) }

  function toggleDay(d) {
    const days = alarm.days.includes(d) ? alarm.days.filter(x => x !== d) : [...alarm.days, d].sort()
    update({ days })
  }

  function save() {
    saveAlarm(alarm)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function toggleNightMode() {
    if (nightMode) {
      // Exit night mode
      setNightMode(false)
      if (silentAudio.current) { silentAudio.current.pause(); silentAudio.current = null }
      try { screen.orientation?.unlock() } catch {}
    } else {
      // Enter night mode — keep audio session alive on iOS
      setNightMode(true)
      // Silent audio loop — tricks iOS into keeping audio context alive
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const buf = ctx.createBuffer(1, 1, 22050)
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.connect(ctx.destination)
      src.start(0)
      // Keep screen on via WakeLock API (works on Android + iOS 16.4+)
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').catch(() => {})
      }
    }
  }

  function stopCurrent() {
    if (currentAudio.current) {
      currentAudio.current.pause()
      currentAudio.current.currentTime = 0
      currentAudio.current = null
    }
    setPlayingId(null)
  }

  function playPreview(voiceId, previewUrl) {
    // Stop whatever is playing
    stopCurrent()
    if (playingId === voiceId) return // toggle off

    const audio = new Audio(previewUrl)
    currentAudio.current = audio
    setPlayingId(voiceId)
    audio.play()
    audio.onended = () => { setPlayingId(null); currentAudio.current = null }
    audio.onerror = () => { setPlayingId(null); currentAudio.current = null }
  }

  async function preview() {
    if (previewing) return
    setPreviewing(true)
    await previewVoice(alarm.text || DEFAULT_TEXT, alarm.voiceId)
    setPreviewing(false)
  }

  const filtered = voices.filter(v => {
    if (genderFilter === 'all') return true
    if (genderFilter === 'male') return v.gender === 'male'
    if (genderFilter === 'female') return v.gender === 'female'
    return true
  })

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div className="screen-label">SYSTEM</div>
        <div className="screen-title">Wecker</div>
        <div className="screen-sub">ElevenLabs AI-Stimme</div>
      </div>

      {/* Live clock */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-2px', color: 'var(--text)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ fontSize: 11, color: '#333', marginTop: 5, letterSpacing: '2px', textTransform: 'uppercase' }}>
          {['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'][clock.getDay()]}
        </div>
      </div>

      {/* ON/OFF + Time */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: alarm.enabled ? 18 : 0 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Wecker</div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{alarm.enabled ? `Aktiv — ${alarm.time} Uhr` : 'Deaktiviert'}</div>
          </div>
          <div onClick={() => update({ enabled: !alarm.enabled })} style={{
            width: 50, height: 28, borderRadius: 14, cursor: 'pointer',
            background: alarm.enabled ? accent : '#1e1e1e',
            border: `1px solid ${alarm.enabled ? accent : '#2a2a2a'}`,
            position: 'relative', transition: 'all 0.25s',
          }}>
            <div style={{
              position: 'absolute', top: 3, left: alarm.enabled ? 25 : 3,
              width: 20, height: 20, borderRadius: '50%',
              background: alarm.enabled ? '#fff' : '#444', transition: 'left 0.25s',
            }} />
          </div>
        </div>

        {alarm.enabled && <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#333', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>Uhrzeit</div>
            <input type="time" value={alarm.time} onChange={e => update({ time: e.target.value })} style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              background: '#0f0f0f', border: '1px solid #1e1e1e',
              color: accent, fontSize: 32, fontWeight: 900,
              fontFamily: 'Inter, sans-serif', letterSpacing: '-1px',
              outline: 'none', boxSizing: 'border-box',
            }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#333', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>Tage</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {DAYS.map((d, i) => {
                const on = alarm.days.includes(i)
                return (
                  <button key={i} onClick={() => toggleDay(i)} style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
                    background: on ? accent + '22' : '#0f0f0f',
                    border: `1px solid ${on ? accent : '#1e1e1e'}`,
                    color: on ? accent : '#333', transition: 'all 0.15s',
                  }}>{d}</button>
                )
              })}
            </div>
          </div>
        </>}
      </div>

      {/* Voice */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#333', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>
          AI-Stimme — ElevenLabs
        </div>

        {/* Voice count */}
        {voices.length > 0 && (
          <div style={{ fontSize: 10, color: '#333', marginBottom: 8 }}>
            {filtered.length} von {voices.length} Stimmen
          </div>
        )}

        {/* Gender filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[['all',`Alle (${voices.length})`], ['male','♂ Männlich'], ['female','♀ Weiblich']].map(([g, label]) => (
            <button key={g} onClick={() => setGenderFilter(g)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
              background: genderFilter === g ? accent + '22' : '#0f0f0f',
              border: `1px solid ${genderFilter === g ? accent : '#1e1e1e'}`,
              color: genderFilter === g ? accent : '#444', transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {/* Voice list */}
        {loading ? (
          <div style={{ fontSize: 12, color: '#444', textAlign: 'center', padding: '16px 0' }}>⏳ Lade Stimmen...</div>
        ) : voiceError ? (
          <div style={{ fontSize: 12, color: '#ef4444', padding: '12px', background: '#ef444411', borderRadius: 8, border: '1px solid #ef444422' }}>
            {voiceError}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ fontSize: 12, color: '#444', textAlign: 'center', padding: '16px 0' }}>
            Keine Stimmen mit diesem Filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto', paddingRight: 2 }}>
            {filtered.map(v => {
              const sel = alarm.voiceId === v.voice_id
              return (
                <div key={v.voice_id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 12px', borderRadius: 8,
                    background: sel ? accent + '18' : '#0f0f0f',
                    border: `1px solid ${sel ? accent + '60' : '#1a1a1a'}`,
                    transition: 'all 0.15s',
                  }}>
                  {/* Select */}
                  <div onClick={() => update({ voiceId: v.voice_id, voiceName: v.name })}
                    style={{ flex: 1, cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: sel ? accent : 'var(--text)' }}>{v.name}</div>
                    <div style={{ fontSize: 10, color: '#333', marginTop: 2 }}>
                      {[v.gender, v.accent, v.age].filter(Boolean).join(' · ') || 'ElevenLabs'}
                    </div>
                  </div>
                  {/* Quick preview — plays ElevenLabs sample, no credits used */}
                  {v.preview_url && (
                    <button onClick={() => playPreview(v.voice_id, v.preview_url)} style={{
                      width: 30, height: 30, borderRadius: 8, border: 'none',
                      background: playingId === v.voice_id ? accent + '30' : '#1a1a1a',
                      color: playingId === v.voice_id ? accent : '#555',
                      cursor: 'pointer', fontSize: 12, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {playingId === v.voice_id ? '◼' : '▶'}
                    </button>
                  )}
                  {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: accent, flexShrink: 0 }} />}
                </div>
              )
            })}
          </div>
        )}

        {/* Preview */}
        <button onClick={preview} disabled={previewing} style={{
          width: '100%', marginTop: 12, padding: '11px', borderRadius: 10,
          background: previewing ? accent + '25' : '#0f0f0f',
          border: `1px solid ${previewing ? accent : '#1e1e1e'}`,
          color: previewing ? accent : '#555', cursor: previewing ? 'wait' : 'pointer',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
        }}>
          {previewing ? '⏳ Generiere...' : '▶ Stimme testen'}
        </button>

        {alarm.voiceName && (
          <div style={{ fontSize: 10, color: accent, marginTop: 8, textAlign: 'center', fontWeight: 600 }}>
            ✓ {alarm.voiceName} ausgewählt
          </div>
        )}
      </div>

      {/* Text */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#333', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>Motivationstext</div>
        <textarea
          value={alarm.text}
          onChange={e => update({ text: e.target.value })}
          placeholder={DEFAULT_TEXT}
          rows={5}
          style={{
            width: '100%', padding: '12px', borderRadius: 10,
            background: '#0f0f0f', border: '1px solid #1e1e1e',
            color: 'var(--text)', fontSize: 13, lineHeight: 1.7,
            fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ fontSize: 10, color: '#2a2a2a', marginTop: 6 }}>
          Die KI-Stimme spricht diesen Text, wenn du aufwachst.
        </div>
      </div>

      {/* Save */}
      <button onClick={save} style={{
        width: '100%', padding: '15px', borderRadius: 12,
        background: saved ? '#22c55e' : accent, border: 'none',
        color: '#000', cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 14, fontWeight: 900, letterSpacing: '0.5px', transition: 'background 0.3s',
        marginBottom: 10,
      }}>
        {saved ? '✓ Gespeichert' : 'Speichern'}
      </button>

      {/* Night Mode — iOS fix */}
      <button onClick={toggleNightMode} style={{
        width: '100%', padding: '14px', borderRadius: 12,
        background: nightMode ? '#1a1a1a' : 'transparent',
        border: `1px solid ${nightMode ? accent : '#1e1e1e'}`,
        color: nightMode ? accent : '#444', cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
        transition: 'all 0.3s',
      }}>
        {nightMode ? '🌙 Nachtmodus aktiv — Tippen zum Beenden' : '🌙 Nachtmodus (iPhone-Fix)'}
      </button>
      {alarm.enabled && !nightMode && (
        <div style={{ fontSize: 10, color: '#2a2a2a', textAlign: 'center', marginTop: 8 }}>
          Für iPhone: Nachtmodus aktivieren, Telefon aufladen, App geöffnet lassen.
        </div>
      )}

      {/* Night mode overlay */}
      {nightMode && (
        <div onClick={toggleNightMode} style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: '#000',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: '#1a1a1a', fontVariantNumeric: 'tabular-nums' }}>
            {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: 11, color: '#111', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Wecker: {alarm.time} Uhr
          </div>
          <div style={{ fontSize: 10, color: '#0f0f0f', marginTop: 20 }}>Tippen zum Beenden</div>
        </div>
      )}
    </div>
  )
}
