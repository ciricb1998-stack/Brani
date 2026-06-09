import { useState, useRef, useEffect } from 'react'
import { useApp } from '../App.jsx'
import { askBrani, loadBraniProfile } from '../utils/braniContext.js'
import { speakElevenLabs, fetchElevenLabsVoices } from '../utils/alarm.js'

// ── 3D Brain SVG ──────────────────────────────────────────────────────────────
export function BrainSVG({ size = 64, color = '#A855F7', pulse = false, listening = false, thinking = false }) {
  const id = `bg_${size}`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{
      display: 'block', overflow: 'visible',
      filter: `drop-shadow(0 0 ${pulse || listening || thinking ? 14 : 6}px ${color}${pulse || listening ? 'cc' : '55'})`,
      transition: 'filter 0.3s',
    }}>
      <defs>
        <radialGradient id={`${id}L`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="60%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.06"/>
        </radialGradient>
        <radialGradient id={`${id}R`} cx="65%" cy="30%" r="65%">
          <stop offset="0%" stopColor={color} stopOpacity="0.32"/>
          <stop offset="60%" stopColor={color} stopOpacity="0.16"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.05"/>
        </radialGradient>
        <radialGradient id={`${id}Hi`} cx="38%" cy="22%" r="40%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* ── Left hemisphere fill ── */}
      <path fill={`url(#${id}L)`} stroke={color} strokeWidth="1.4" strokeOpacity="0.85"
        d="M50,14
           C46,10 40,7 33,7
           C22,7 13,13 9,22
           C5,30 6,40 9,49
           C12,57 17,64 22,70
           C27,75 33,79 40,81
           C44,82 47,81 50,80
           L50,14 Z"/>

      {/* ── Right hemisphere fill ── */}
      <path fill={`url(#${id}R)`} stroke={color} strokeWidth="1.4" strokeOpacity="0.85"
        d="M50,14
           C54,10 60,7 67,7
           C78,7 87,13 91,22
           C95,30 94,40 91,49
           C88,57 83,64 78,70
           C73,75 67,79 60,81
           C56,82 53,81 50,80
           L50,14 Z"/>

      {/* ── Highlight shimmer ── */}
      <path fill={`url(#${id}Hi)`}
        d="M50,14 C46,10 40,7 33,7 C22,7 13,13 9,22 C5,30 6,40 9,49 L50,14 Z"/>
      <path fill={`url(#${id}Hi)`}
        d="M50,14 C54,10 60,7 67,7 C78,7 87,13 91,22 C95,30 94,40 91,49 L50,14 Z"/>

      {/* ── Central fissure ── */}
      <line x1="50" y1="13" x2="50" y2="81" stroke={color} strokeWidth="1.2" strokeOpacity="0.7"/>

      {/* ── Left gyri (curved folds) ── */}
      <path fill="none" stroke={color} strokeWidth="1.1" strokeOpacity="0.65" strokeLinecap="round"
        d="M36,16 C29,20 23,27 26,35"/>
      <path fill="none" stroke={color} strokeWidth="1.1" strokeOpacity="0.65" strokeLinecap="round"
        d="M22,26 C15,34 14,44 21,52"/>
      <path fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.6" strokeLinecap="round"
        d="M19,44 C13,53 16,64 25,70"/>
      <path fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.55" strokeLinecap="round"
        d="M29,68 C23,73 21,78 28,82"/>
      <path fill="none" stroke={color} strokeWidth="0.9" strokeOpacity="0.5" strokeLinecap="round"
        d="M40,22 C33,28 30,38 34,46"/>

      {/* ── Right gyri (mirror) ── */}
      <path fill="none" stroke={color} strokeWidth="1.1" strokeOpacity="0.65" strokeLinecap="round"
        d="M64,16 C71,20 77,27 74,35"/>
      <path fill="none" stroke={color} strokeWidth="1.1" strokeOpacity="0.65" strokeLinecap="round"
        d="M78,26 C85,34 86,44 79,52"/>
      <path fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.6" strokeLinecap="round"
        d="M81,44 C87,53 84,64 75,70"/>
      <path fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.55" strokeLinecap="round"
        d="M71,68 C77,73 79,78 72,82"/>
      <path fill="none" stroke={color} strokeWidth="0.9" strokeOpacity="0.5" strokeLinecap="round"
        d="M60,22 C67,28 70,38 66,46"/>

      {/* ── Cerebellum ── */}
      <path fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.1" strokeOpacity="0.6"
        d="M36,81 C34,87 36,93 43,95 C46,96 50,96 54,95 C61,93 66,87 64,81"/>
      <line x1="50" y1="81" x2="50" y2="96" stroke={color} strokeWidth="0.9" strokeOpacity="0.5"/>
      <path fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.4"
        d="M38,85 C42,88 44,92 43,95"/>
      <path fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.4"
        d="M62,85 C58,88 56,92 57,95"/>

      {/* ── Neural dots ── */}
      {[[27,32],[20,50],[30,72],[44,50],[18,35],[35,60]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill={color} fillOpacity={0.5 + i*0.07}/>
      ))}
      {[[73,32],[80,50],[70,72],[56,50],[82,35],[65,60]].map(([x,y],i) => (
        <circle key={i+10} cx={x} cy={y} r="1.2" fill={color} fillOpacity={0.5 + i*0.07}/>
      ))}
    </svg>
  )
}

// ── Voice settings panel ──────────────────────────────────────────────────────
function VoiceSettings({ onClose }) {
  const [voices, setVoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(() => localStorage.getItem('brani_ai_voice_id') || '')
  const [previewing, setPreviewing] = useState(null)
  const audioRef = useRef(null)

  useEffect(() => {
    fetchElevenLabsVoices().then(({ voices: v, error: e }) => {
      setVoices(v || [])
      setError(e || '')
      setLoading(false)
    })
  }, [])

  async function playPreview(v) {
    if (previewing === v.voice_id) {
      audioRef.current?.pause()
      setPreviewing(null)
      return
    }
    audioRef.current?.pause()
    if (v.preview_url) {
      const a = new Audio(v.preview_url)
      audioRef.current = a
      setPreviewing(v.voice_id)
      a.onended = () => setPreviewing(null)
      a.play().catch(() => setPreviewing(null))
    }
  }

  function selectVoice(id) {
    setSelected(id)
    localStorage.setItem('brani_ai_voice_id', id)
  }

  const filtered = filter === 'all' ? voices : voices.filter(v =>
    filter === 'm' ? v.gender === 'male' : v.gender === 'female'
  )

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      background: '#080808', overflowY: 'auto',
      padding: 'calc(env(safe-area-inset-top, 0px) + 52px) 20px calc(20px + env(safe-area-inset-bottom))',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#A855F7', letterSpacing: '3px' }}>STIMME WÄHLEN</span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#555', fontSize: 22, cursor: 'pointer', padding: 4,
        }}>×</button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['all','Alle'],['m','Männlich'],['f','Weiblich']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '1px',
            padding: '6px 14px', borderRadius: 20,
            background: filter === k ? '#A855F7' : '#111',
            border: `1px solid ${filter === k ? '#A855F7' : '#1e1e1e'}`,
            color: filter === k ? '#fff' : '#555',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{l}</button>
        ))}
      </div>

      {loading && <div style={{ color: '#444', fontSize: 12, textAlign: 'center', padding: 40 }}>Lade Stimmen...</div>}
      {error && <div style={{ color: '#ef4444', fontSize: 11, padding: 12, background: '#1a0808', borderRadius: 8, border: '1px solid #ef444430' }}>{error}</div>}

      {filtered.map(v => {
        const isSelected = selected === v.voice_id
        const isPlaying = previewing === v.voice_id
        return (
          <div key={v.voice_id} onClick={() => selectVoice(v.voice_id)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 12, marginBottom: 8,
            background: isSelected ? '#A855F720' : '#0f0f0f',
            border: `1px solid ${isSelected ? '#A855F760' : '#161616'}`,
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: isSelected ? '#A855F7' : '#222',
              border: `1.5px solid ${isSelected ? '#A855F7' : '#333'}`,
              transition: 'all 0.15s',
            }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#A855F7' : '#ddd' }}>{v.name}</div>
              <div style={{ fontSize: 10, color: '#444', letterSpacing: '0.5px' }}>
                {[v.gender === 'male' ? '♂' : v.gender === 'female' ? '♀' : '—', v.accent, v.age].filter(Boolean).join(' · ')}
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); playPreview(v) }} style={{
              background: isPlaying ? '#A855F720' : '#111', border: `1px solid ${isPlaying ? '#A855F7' : '#222'}`,
              borderRadius: 8, color: isPlaying ? '#A855F7' : '#555',
              fontSize: 14, width: 32, height: 32, cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isPlaying ? '■' : '▶'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Main BraniAI overlay ──────────────────────────────────────────────────────
export default function BraniAI({ open, onClose }) {
  const { settings } = useApp()
  const [phase, setPhase] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [showVoice, setShowVoice] = useState(false)
  const recRef = useRef(null)
  const langMap = { bs: 'hr-HR', de: 'de-DE', en: 'en-US' }
  const lang = langMap[settings.lang] || 'hr-HR'

  useEffect(() => {
    if (open) { setPhase('idle'); setTranscript(''); setReply(''); setError(''); setShowVoice(false) }
    if (!open) recRef.current?.abort()
  }, [open])

  async function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError('Mikrofon nicht unterstützt'); return }
    setPhase('listening'); setTranscript(''); setReply(''); setError('')
    const rec = new SR()
    recRef.current = rec
    rec.lang = lang; rec.continuous = false; rec.interimResults = false
    let captured = ''
    rec.onresult = e => { captured = Array.from(e.results).map(r => r[0].transcript).join(' ') }
    rec.onend = async () => {
      if (!captured.trim()) { setPhase('idle'); return }
      setTranscript(captured.trim())
      setPhase('thinking')
      const { reply: r, error: e } = await askBrani(captured.trim())
      if (e) { setError(e); setPhase('error'); return }
      setReply(r)
      setPhase('speaking')
      const voiceId = localStorage.getItem('brani_ai_voice_id') || ''
      let spoke = false
      if (voiceId) {
        // speakElevenLabs returns null on failure, undefined on success
        const result = await speakElevenLabs(r, voiceId)
        spoke = result !== null
      }
      if (!spoke) {
        // fallback: browser TTS
        await new Promise(res => {
          speechSynthesis.cancel()
          const u = new SpeechSynthesisUtterance(r)
          u.lang = lang; u.rate = 0.95; u.onend = res; u.onerror = res
          speechSynthesis.speak(u)
        })
      }
      setPhase('done')
    }
    rec.onerror = () => setPhase('idle')
    rec.start()
  }

  function stop() { recRef.current?.stop(); speechSynthesis.cancel() }

  const profile = loadBraniProfile()
  const addressName = profile?.address || 'Branislave'

  const labels = {
    idle: `Tap — BRANI höre zu, ${addressName}`,
    listening: `Spreche, ${addressName}...`,
    thinking: 'BRANI denkt...',
    speaking: 'BRANI spricht...',
    done: `Tap für neue Frage`,
    error: error,
  }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9200,
      background: 'rgba(4,4,4,0.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <style>{`
        @keyframes brainSpin  { from{transform:rotateY(0deg)} to{transform:rotateY(360deg)} }
        @keyframes brainFast  { from{transform:rotateY(0deg)} to{transform:rotateY(360deg)} }
        @keyframes brainPulse { 0%,100%{transform:rotateY(0deg) scale(1)} 50%{transform:rotateY(180deg) scale(1.07)} }
        @keyframes rayPulse   { 0%,100%{opacity:.12;transform:scaleY(.3)} 50%{opacity:.9;transform:scaleY(1)} }
        @keyframes waveBar    { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
        @keyframes fadeSlide  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Relative container for settings overlay */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

        {showVoice && <VoiceSettings onClose={() => setShowVoice(false)} />}

        {/* Top bar */}
        {!showVoice && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'calc(env(safe-area-inset-top, 0px) + 52px) 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
            <button onClick={onClose} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, color: '#555', fontSize: 18, cursor: 'pointer', padding: '6px 12px', fontFamily: 'inherit', lineHeight: 1 }}>×</button>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#A855F7', letterSpacing: '3px' }}>BRANI AI</span>
            <button onClick={() => setShowVoice(true)} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, color: '#555', fontSize: 14, cursor: 'pointer', padding: '6px 10px', fontFamily: 'inherit' }}>⚙</button>
          </div>
        )}

        {!showVoice && <>
          {/* Ambient rays (listening only) */}
          {phase === 'listening' && (
            <div style={{ position: 'absolute', pointerEvents: 'none', zIndex: 0 }}>
              {Array.from({length: 16}).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute', width: 2, height: 80, borderRadius: 2,
                  background: 'linear-gradient(to top, #A855F7, transparent)',
                  transformOrigin: 'bottom center',
                  transform: `rotate(${i*22.5}deg) translateY(-120px)`,
                  animation: `rayPulse ${0.35+i*0.05}s ease-in-out infinite`,
                  animationDelay: `${i*0.05}s`,
                }}/>
              ))}
            </div>
          )}

          {/* 3D Brain */}
          <div
            onClick={() => {
              if (phase === 'idle' || phase === 'done') startListening()
              else if (phase === 'listening') stop()
            }}
            style={{
              cursor: 'pointer', marginBottom: 36, position: 'relative', zIndex: 1,
              perspective: '220px',
            }}
          >
            {/* Outer glow ring */}
            <div style={{
              position: 'absolute', inset: -30,
              borderRadius: '50%',
              background: `radial-gradient(circle, #A855F7${phase === 'listening' ? '25' : phase === 'thinking' || phase === 'speaking' ? '18' : '0e'} 0%, transparent 70%)`,
              transition: 'background 0.5s',
              pointerEvents: 'none',
            }}/>

            <div style={{
              animation:
                phase === 'listening' ? 'brainFast 1.8s linear infinite' :
                phase === 'thinking'  ? 'brainFast 1.0s linear infinite' :
                phase === 'speaking'  ? 'brainPulse 2s ease-in-out infinite' :
                'brainSpin 6s linear infinite',
              transformStyle: 'preserve-3d',
              transition: 'none',
            }}>
              <BrainSVG
                size={130}
                color="#A855F7"
                pulse={phase === 'thinking'}
                listening={phase === 'listening'}
                thinking={phase === 'thinking'}
              />
            </div>
          </div>

          {/* Phase label */}
          <div style={{ fontSize: 12, fontWeight: 700, color: '#A855F7', letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center', marginBottom: 20, zIndex: 1 }}>
            {labels[phase]}
          </div>

          {/* Waveform bars (listening) */}
          {phase === 'listening' && (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 20, zIndex: 1 }}>
              {[.5,1,.7,.9,.4,.8,.6,.95,.45,.75].map((h,i) => (
                <div key={i} style={{
                  width: 3, height: 24, borderRadius: 3,
                  background: '#A855F7', transformOrigin: 'center',
                  animation: `waveBar ${0.4+i*0.06}s ease-in-out infinite`,
                  animationDelay: `${i*0.05}s`,
                }}/>
              ))}
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div style={{ fontSize: 13, color: '#555', fontStyle: 'italic', textAlign: 'center', maxWidth: 300, marginBottom: 16, lineHeight: 1.6, zIndex: 1, animation: 'fadeSlide 0.3s ease both' }}>
              „{transcript}"
            </div>
          )}

          {/* Reply */}
          {reply && (
            <div style={{
              fontSize: 15, color: '#e0e0e0', lineHeight: 1.75, textAlign: 'center',
              maxWidth: 320, background: '#0f0f0f', borderRadius: 16,
              border: '1px solid #A855F725', padding: '18px 22px',
              zIndex: 1, animation: 'fadeSlide 0.35s ease both',
            }}>
              {reply}
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div style={{ fontSize: 11, color: '#ef4444', background: '#1a0808', border: '1px solid #ef444430', borderRadius: 10, padding: '10px 16px', maxWidth: 300, textAlign: 'center', zIndex: 1 }}>
              {error}
            </div>
          )}
        </>}
      </div>
    </div>
  )
}
