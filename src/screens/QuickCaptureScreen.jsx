import { useState, useRef } from 'react'
import { useApp } from '../App.jsx'
import { loadCaptures, saveCaptures } from '../utils/storage.js'
import { hasSlack, sendToSlack, slackCaptureMsg } from '../utils/slack.js'
import { Check, Microphone, MicrophoneSlash } from '@phosphor-icons/react'

const TAG_COLORS = { ideja: '#a855f7', zadatak: '#3b82f6', followup: '#f59e0b', licno: '#22c55e', biznis: '#06b6d4' }

export default function QuickCaptureScreen() {
  const { t, settings } = useApp()

  const TAGS = [
    { id: 'ideja',    label: t.tag_ideja,    color: TAG_COLORS.ideja },
    { id: 'zadatak',  label: t.tag_zadatak,  color: TAG_COLORS.zadatak },
    { id: 'followup', label: t.tag_followup, color: TAG_COLORS.followup },
    { id: 'licno',    label: t.tag_licno,    color: TAG_COLORS.licno },
    { id: 'biznis',   label: t.tag_biznis,   color: TAG_COLORS.biznis },
  ]
  const TAG_FILTER = [{ id: 'all', label: t.filter_all, color: 'var(--accent)' }, ...TAGS]
  const [captures, setCaptures] = useState(loadCaptures)
  const [text, setText] = useState('')
  const [tag, setTag] = useState('ideja')
  const [filter, setFilter] = useState('all')
  const [flash, setFlash] = useState(false)
  const [listening, setListening] = useState(false)
  const [slackFlash, setSlackFlash] = useState(null)
  const [slackSending, setSlackSending] = useState(null)
  const [calFlash, setCalFlash] = useState(null)
  const recognitionRef = useRef(null)
  const slackEnabled = hasSlack()

  function persist(next) { setCaptures(next); saveCaptures(next) }

  function add() {
    if (!text.trim()) return
    const next = [{ id: Date.now().toString(), text: text.trim(), tag, createdAt: new Date().toISOString() }, ...captures]
    persist(next)
    setText('')
    setFlash(true)
    setTimeout(() => setFlash(false), 1200)
  }

  function del(id) { persist(captures.filter(c => c.id !== id)) }

  async function sendCaptureToSlack(c) {
    if (slackSending === c.id) return
    setSlackSending(c.id)
    const result = await sendToSlack(slackCaptureMsg(c.text, c.tag))
    setSlackSending(null)
    if (result.ok) {
      setSlackFlash(c.id)
      setTimeout(() => setSlackFlash(null), 2000)
    }
  }

  function addToGoogleCalendar(c) {
    const start = new Date(c.createdAt)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const title = encodeURIComponent(c.text.replace('🎤 ', ''))
    const tag = TAGS.find(x => x.id === c.tag)
    const details = encodeURIComponent(`Tag: ${tag?.label || c.tag}\nErstellt in BRANI System`)
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${fmt(start)}/${fmt(end)}`
    window.open(url, '_blank')
    setCalFlash(c.id)
    setTimeout(() => setCalFlash(null), 2000)
  }

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = { bs: 'hr-HR', de: 'de-DE', en: 'en-US' }[settings.lang] || 'hr-HR'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = e => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ')
      setText(prev => prev ? prev + ' ' + transcript : transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.start()
    setListening(true)
  }

  const visible = filter === 'all' ? captures : captures.filter(c => c.tag === filter)

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">CAPTURE</div>
          <div className="screen-title">{t.quick_capture_title}</div>
          <div className="screen-sub">{t.quick_capture_sub}</div>
        </div>
      </div>

      {/* Input card */}
      <div className="card" style={{ marginBottom: 12, border: flash ? '0.5px solid var(--accent)' : '0.5px solid var(--card-border)', transition: 'border 0.3s' }}>
        <div className="card-glow" />
        <textarea
          className="field-textarea"
          style={{ height: 110, fontSize: 15, lineHeight: 1.65, border: 'none', background: 'transparent', resize: 'none', padding: 0, margin: '0 0 12px', fontFamily: 'inherit' }}
          placeholder={listening ? (t.voice_listening || 'Slušam...') : t.capture_placeholder}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) add() }}
          autoFocus
        />

        {/* Tags + mic row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {TAGS.map(tg => (
            <button key={tg.id} type="button" onClick={() => setTag(tg.id)} style={{
              padding: '5px 11px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              background: tag === tg.id ? tg.color + '22' : 'transparent',
              border: `0.5px solid ${tag === tg.id ? tg.color : 'var(--card-border)'}`,
              color: tag === tg.id ? tg.color : 'var(--text-dimmer)',
              transition: 'all 0.15s',
            }}>{tg.label}</button>
          ))}
          <button
            type="button"
            onClick={toggleVoice}
            title={t.voice_note || 'Glasovni unos'}
            style={{
              marginLeft: 'auto', width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: listening ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'var(--card)',
              color: listening ? 'white' : 'var(--text-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: listening ? '0 0 12px rgba(239,68,68,0.4)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {listening ? <MicrophoneSlash weight="fill" size={16} /> : <Microphone size={16} />}
          </button>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', background: flash ? 'var(--green)' : 'var(--accent)', transition: 'background 0.3s' }}
          onClick={add}
        >
          {flash
            ? <><Check size={14} /> {t.saved_flash}</>
            : <>{t.save_capture}  <span style={{ opacity: 0.5, fontSize: 11 }}>⌘↵</span></>
          }
        </button>
      </div>

      {/* Funnel */}
      {captures.length > 0 && (
        <div style={{ display: 'flex', gap: 5, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
          {TAG_FILTER.map(tg => (
            <button key={tg.id} type="button" onClick={() => setFilter(tg.id)} style={{
              flexShrink: 0, padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              background: filter === tg.id ? tg.color + '20' : 'transparent',
              border: `0.5px solid ${filter === tg.id ? tg.color : 'var(--card-border)'}`,
              color: filter === tg.id ? tg.color : 'var(--text-dimmer)',
            }}>{tg.label}</button>
          ))}
        </div>
      )}

      {/* List */}
      {visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dimmer)', fontSize: 13 }}>
          {captures.length === 0 ? t.nothing_captured : t.no_filter_entries}
        </div>
      )}

      {visible.map(c => {
        const tg = TAGS.find(x => x.id === c.tag) || TAGS[0]
        const d = new Date(c.createdAt)
        return (
          <div key={c.id} className="card" style={{ marginBottom: 8, borderLeft: `2.5px solid ${tg.color}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: tg.color, background: tg.color + '18', padding: '2px 8px', borderRadius: 10 }}>{tg.label}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>{d.toLocaleDateString()} · {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {c.text.startsWith('🎤') && <span style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>🎤</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{c.text}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, alignItems: 'flex-end' }}>
                {/* Google Calendar */}
                <button
                  type="button"
                  onClick={() => addToGoogleCalendar(c)}
                  style={{
                    height: 22, padding: '0 7px', borderRadius: 5,
                    border: `1px solid ${calFlash === c.id ? '#22c55e44' : '#EA433544'}`,
                    background: calFlash === c.id ? '#22c55e22' : '#EA433511',
                    color: calFlash === c.id ? '#22c55e' : '#EA4335',
                    fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.3px',
                    transition: 'all 0.2s',
                  }}
                >
                  {calFlash === c.id ? '✓ Gespeichert' : '📅 Kalender'}
                </button>
                {/* Slack */}
                {slackEnabled && (
                  <button
                    type="button"
                    onClick={() => sendCaptureToSlack(c)}
                    disabled={slackSending === c.id}
                    style={{
                      height: 22, padding: '0 7px', borderRadius: 5, border: '1px solid #4A90E222',
                      background: slackFlash === c.id ? '#22c55e22' : '#4A90E211',
                      color: slackFlash === c.id ? 'var(--green)' : '#4A90E2',
                      fontSize: 10, fontWeight: 700, cursor: slackSending === c.id ? 'wait' : 'pointer',
                      fontFamily: 'inherit', letterSpacing: '0.3px', transition: 'all 0.2s',
                      opacity: slackSending === c.id ? 0.5 : 1,
                    }}
                  >
                    {slackFlash === c.id ? '✓ Gesendet' : slackSending === c.id ? '...' : 'Slack'}
                  </button>
                )}
                <button type="button" onClick={() => del(c.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dimmer)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
              </div>
            </div>
          </div>
        )
      })}

      {visible.length > 0 && (
        <div style={{ textAlign: 'center', padding: '8px 0 4px', fontSize: 10, color: 'var(--text-dimmer)' }}>
          {visible.length} {t.entries_count}
        </div>
      )}
    </div>
  )
}
