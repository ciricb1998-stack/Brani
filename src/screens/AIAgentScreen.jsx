import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../App.jsx'
import {
  loadDayData, loadWeekData, loadAIKey,
  loadMonthlyGoals, loadFootballProfile,
  loadHabits, loadHabitLog,
  saveChatHistory, loadChatHistory, clearChatHistory,
  loadMemoryEntries, addMemoryEntry, clearMemory
} from '../utils/storage.js'
import { Brain, Lightning, ChatCircle, TrendUp, Pulse, Moon, Package, PaperPlaneTilt, User, Microphone, MicrophoneSlash, SpeakerHigh, SpeakerX, XCircle } from '@phosphor-icons/react'

// ── Build system prompt ───────────────────────────────────────────────────────
function buildSystemPrompt() {
  const today = new Date()
  const days7 = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    const data = loadDayData(d)
    const tasks = [data.task1Done, data.task2Done, data.task3Done].filter(Boolean).length
    days7.push({ date: d, data, tasks })
  }

  const todayData = loadDayData(today)
  const weekData = loadWeekData(today)
  const football = loadFootballProfile()
  const goals = loadMonthlyGoals(today.getFullYear(), today.getMonth() + 1)
  const habits = loadHabits()
  const habitLog = loadHabitLog(today)
  const memory = loadMemoryEntries()

  let streak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    const dd = loadDayData(d)
    if (dd.task1Done || dd.task2Done || dd.task3Done) streak++
    else if (i > 0) break
  }

  const totalTasks = days7.reduce((s, d) => s + d.tasks, 0)
  const activeDays7 = days7.filter(d => d.tasks > 0).length

  const memoryBlock = memory.length > 0
    ? `\n═══ MEMORIJA O NJEMU ═══\n${memory.map(m => {
        const date = new Date(m.ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
        return `[${date}] ${m.summary}`
      }).join('\n')}\n\nKoristiš ovu memoriju da povežeš obrasce, uočiš ponavljajuće probleme i pokažeš mu kako se mijenja (ili ne mijenja) kroz vrijeme.`
    : '\n═══ MEMORIJA ═══\nPrvi razgovor — još nema akumulirane memorije.'

  return `TI SI: BRANI AI — Branikin personalni mentor. Direktan, bez filtera, empatičan.

TVOJA ULOGA:
Nisi generički chatbot. Nisi teorijski coach. Ti si neko ko intimno poznaje Branimira — sve njegove podatke, obrasce, ciljeve, borbe. Govoriš kao stariji brat koji je prošao isti put i kaže istinu.

KAKO GOVORIŠ:
- Direktno i kratko. Bez uvoda, bez floskula, bez "odlično!".
- Konkretno — uvijek završiš s jednom akcijom ili jednim pitanjem.
- Kada vidiš obrazac iz memorije — imenuj ga eksplicitno: "Vidim da ti se ovo vraća..."
- Grubo kada treba, nježno kada treba. Uvijek iskreno.
- Nikad generički savjet koji bi mogao dobiti od bilo koga.
- Pišeš na bosanskom osim ako on ne napiše na drugom jeziku.
${memoryBlock}

═══ PODACI DANAS ═══
Datum: ${today.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
Streak: ${streak} dana zaredom
Ova sedmica: ${activeDays7}/7 dana aktivno, ${totalTasks} zadataka

ZADNJIH 7 DANA:
${days7.map(d => {
  const date = d.date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
  return `${date}: ${d.tasks}/3 zadataka ${d.data.workout ? '💪' : ''}${d.data.meditation ? '🧘' : ''} · San: ${d.data.sleep || '?'}h · Energija: ${d.data.energy || '?'}/10`
}).join('\n')}

DANAS:
Osjećaj: ${todayData.feeling || '?'}/10 · Energija: ${todayData.energy || '?'}/10 · San: ${todayData.sleep || '?'}h
Rutina: ${todayData.morningRoutine ? '✓' : '✗'} · Trening: ${todayData.workout ? '✓' : '✗'} · Meditacija: ${todayData.meditation ? '✓' : '✗'}
Zadaci: ${[1,2,3].map(i => `${todayData[`task${i}Done`] ? '✓' : '○'} ${todayData[`task${i}`] || '(prazno)'}`).join(' | ')}
Pobjede: ${todayData.wins || '—'} · Izazovi: ${todayData.challenges || '—'}

SEDMIČNI CILJEVI: ${[1,2,3].map(i => weekData[`goal${i}`] || '—').join(' | ')}
Prihod: ${weekData.revenue ? weekData.revenue + '€' : '—'} · Klijenti: ${weekData.clients || '—'} · Projekti: ${weekData.projects || '—'}

FUDBAL: Faza: ${football.phase || '—'} · Povreda: ${football.injuryType || '—'} · Cilj: ${football.targetReturn || '—'}

CILJEVI OVOG MJESECA: ${goals.length ? goals.map(g => `${g.done ? '✓' : '○'} ${g.text}`).join(' | ') : '—'}

NAVIKE DANAS: ${habits.map(h => `${habitLog[h.id] ? '✓' : '○'} ${h.name}`).join(' · ') || '—'}`
}

// ── Generate memory summary ───────────────────────────────────────────────────
async function generateMemorySummary(messages, apiKey) {
  if (messages.filter(m => m.role === 'user').length < 2) return null
  const convo = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .slice(-20)
    .map(m => `${m.role === 'user' ? 'BRANI' : 'MENTOR'}: ${m.content}`)
    .join('\n\n')

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: `Analiziraj razgovor između Branislava i njegovog AI mentora.
Napiši JEDAN kratki paragraf (max 4 rečenice) koji bilježi:
- Ključne teme/probleme koje je Brani izrazio
- Emotivno stanje ili blokade koje su vidljive
- Obećanja, odluke ili uvide do kojih je došao
- Obrasce koji se ponavljaju (ako postoje)
Budi konkretan. Samo činjenice. Pisati u trećem licu: "Brani je..."`,
        messages: [{ role: 'user', content: `Analiziraj:\n\n${convo}` }]
      })
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.content[0].text.trim()
  } catch { return null }
}

// ── Quick prompts ─────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: <Lightning weight="fill" size={12} />, label: 'Zašto krečem?', msg: 'Podsjeti me zašto sam krenuo sve ovo. Odakle dolazim i kuda idem.' },
  { icon: <ChatCircle weight="fill" size={12} />, label: 'Istina', msg: 'Pogledaj moje podatke i reci mi istinu. Bez ljepšanja. Šta vidiš?' },
  { icon: <TrendUp weight="fill" size={12} />, label: 'Gurni me', msg: 'Stao sam. Trebam da me guraš. Uradi to.' },
  { icon: <Pulse weight="fill" size={12} />, label: 'Fudbal', msg: 'Govori mi o povratku na teren. Šta mi treba čuti?' },
  { icon: <Package weight="fill" size={12} />, label: 'Biznis', msg: 'Jedna konkretna akcija za BRANI+ danas. Bez teorije.' },
  { icon: <Moon weight="fill" size={12} />, label: 'Sumnja', msg: 'Imam trenutak sumnje. Je li sve ovo vrijedi? Reci mi.' },
]

// ── Voice button (Claude-style) ───────────────────────────────────────────────
function MicButton({ listening, onToggle, disabled }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      style={{
        width: 44, height: 44,
        borderRadius: '50%',
        background: listening
          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
          : 'var(--card)',
        border: listening ? 'none' : '0.5px solid var(--card-border)',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        transition: 'all 0.2s',
        boxShadow: listening ? '0 0 0 3px rgba(239,68,68,0.25), 0 0 20px rgba(239,68,68,0.3)' : 'none',
        touchAction: 'manipulation',
      }}
      aria-label={listening ? 'Zaustavi snimanje' : 'Govori glasom'}
    >
      {listening && (
        <span style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          border: '2px solid rgba(239,68,68,0.4)',
          animation: 'voiceRing 1.4s ease-out infinite',
        }} />
      )}
      {listening
        ? <XCircle weight="fill" size={18} color="white" style={{ position: 'relative', zIndex: 1 }} />
        : <Microphone size={17} color="var(--text-dimmer)" />
      }
    </button>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 10,
      animation: 'slideUp 0.2s ease both'
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--purple-dim)', border: '1px solid var(--purple)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, color: 'var(--purple)', flexShrink: 0, marginRight: 8, marginTop: 2
        }}>M</div>
      )}
      <div style={{
        maxWidth: '80%',
        padding: '10px 14px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isUser ? 'var(--accent)' : 'var(--card)',
        border: isUser ? 'none' : '0.5px solid var(--card-border)',
        fontSize: 13,
        lineHeight: 1.65,
        color: isUser ? 'white' : 'var(--text)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        {msg.content}
        <div style={{ fontSize: 9, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>
          {new Date(msg.ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--purple-dim)', border: '1px solid var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--purple)' }}>M</div>
      <div style={{ padding: '10px 14px', background: 'var(--card)', borderRadius: '14px 14px 14px 4px', border: '0.5px solid var(--card-border)', display: 'flex', gap: 4, alignItems: 'center' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AIAgentScreen() {
  const { settings, setScreen, t } = useApp()
  const lang = settings.lang || 'bs'
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingMemory, setSavingMemory] = useState(false)
  const [apiKey, setApiKey] = useState(loadAIKey)
  const [memoryCount, setMemoryCount] = useState(() => loadMemoryEntries().length)
  const [listening, setListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(() => localStorage.getItem('brani_tts') !== 'false')
  const [voiceSupported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition))
  const [ttsSupported] = useState(() => 'speechSynthesis' in window)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  const TTS_LANG = { bs: 'hr-HR', de: 'de-DE', en: 'en-US' }

  function speak(text) {
    if (!ttsEnabled || !ttsSupported) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text.slice(0, 500))
    utt.lang = TTS_LANG[lang] || 'hr-HR'
    utt.rate = 0.92
    utt.pitch = 1.0
    utt.volume = 1
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.lang.startsWith((TTS_LANG[lang] || 'hr').split('-')[0]) && v.name.toLowerCase().includes('male'))
      || voices.find(v => v.lang.startsWith((TTS_LANG[lang] || 'hr').split('-')[0]))
    if (preferred) utt.voice = preferred
    window.speechSynthesis.speak(utt)
  }

  function toggleTts() {
    const next = !ttsEnabled
    setTtsEnabled(next)
    localStorage.setItem('brani_tts', next ? 'true' : 'false')
    if (!next) window.speechSynthesis.cancel()
  }

  // Claude-style voice: click to start → recording → click to stop → auto-send
  const toggleVoice = useCallback(() => {
    if (listening) {
      // Stop recording — recognition.onend will fire and we'll auto-send
      recognitionRef.current?.stop()
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR || loading) return

    const recognition = new SR()
    // hr-HR is most compatible for Bosnian/Croatian/Serbian
    recognition.lang = lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-US' : 'hr-HR'
    recognition.continuous = true        // keep recording until explicitly stopped
    recognition.interimResults = true    // show live transcription
    recognition.maxAlternatives = 1

    let finalTranscript = ''

    recognition.onstart = () => {
      setListening(true)
      finalTranscript = ''
    }

    recognition.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript
        } else {
          interim += e.results[i][0].transcript
        }
      }
      const display = finalTranscript + interim
      setInput(display)
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
      }
    }

    recognition.onend = () => {
      setListening(false)
      // Auto-send if we captured text
      if (finalTranscript.trim()) {
        setTimeout(() => {
          sendMessageRef.current?.(finalTranscript.trim())
          setInput('')
        }, 100)
      }
    }

    recognition.onerror = (e) => {
      if (e.error !== 'aborted') {
        setListening(false)
        console.warn('Speech error:', e.error)
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch (e) {
      console.warn('Could not start recognition:', e)
    }
  }, [listening, lang, loading])

  // Keep sendMessage stable ref so recognition.onend can call it
  const sendMessageRef = useRef(null)

  // Reload API key when sync arrives
  useEffect(() => {
    const handler = () => {
      const fresh = loadAIKey()
      if (fresh) setApiKey(fresh)
    }
    window.addEventListener('brani-sync', handler)
    return () => window.removeEventListener('brani-sync', handler)
  }, [])

  // Load chat history on mount
  useEffect(() => {
    const history = loadChatHistory()
    if (history.length > 0) {
      setMessages(history)
    } else {
      setMessages([{
        role: 'assistant',
        content: 'Ovdje sam.\n\nTvoj mentor. Imam sve tvoje podatke — vidim gdje napređuješ i gdje stagniraš.\n\nŠta te zaustavio danas, ili šta trebaš čuti?',
        ts: Date.now()
      }])
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (messages.length > 0) saveChatHistory(messages.slice(-50))
  }, [messages])

  useEffect(() => {
    function handleUnload() {
      const realMessages = messages.filter(m => m.role === 'user').length
      if (realMessages >= 2 && apiKey) {
        generateMemorySummary(messages, apiKey).then(summary => {
          if (summary) addMemoryEntry({ summary })
        })
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [messages, apiKey])

  async function sendMessage(text) {
    if (!text.trim() || loading) return
    if (!apiKey) return

    const userMsg = { role: 'user', content: text.trim(), ts: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const apiMessages = newMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: buildSystemPrompt(),
          messages: apiMessages
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `API greška ${res.status}`)
      }

      const data = await res.json()
      const reply = data.content[0].text
      const assistantMsg = { role: 'assistant', content: reply, ts: Date.now() }
      setMessages(prev => [...prev, assistantMsg])
      speak(reply)
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Greška: ${e.message}\n\nProver API ključ u Profil → AI Coach.`,
        ts: Date.now()
      }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  // Update ref every render
  sendMessageRef.current = sendMessage

  async function handleClear() {
    const realMessages = messages.filter(m => m.role === 'user').length
    if (realMessages >= 2 && apiKey) {
      setSavingMemory(true)
      const summary = await generateMemorySummary(messages, apiKey)
      if (summary) {
        addMemoryEntry({ summary })
        setMemoryCount(loadMemoryEntries().length)
      }
      setSavingMemory(false)
    }
    clearChatHistory()
    setMessages([{
      role: 'assistant',
      content: 'Ovdje sam.\n\nTvoj mentor. Imam sve tvoje podatke — vidim gdje napređuješ i gdje stagniraš.\n\nŠta te zaustavio danas, ili šta trebaš čuti?',
      ts: Date.now()
    }])
  }

  if (!apiKey) {
    return (
      <div className="screen fade-in">
        <div className="screen-header">
          <div>
          <div className="screen-label">AI COACH</div>
            <div className="screen-title">BRANI Mentor</div>
            <div className="screen-sub">AI Coach · Tvoj personalni mentor</div>
          </div>
        </div>
        <div className="card" style={{ marginTop: 20, textAlign: 'center', padding: '32px 20px' }}>
          <div className="card-glow" style={{ background: 'var(--purple-dim)' }} />
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--purple-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--purple)' }}>
            <Brain weight="fill" size={32} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            {t?.api_key_not_set || 'API ključ nije postavljen'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 20 }}>
            Za AI Mentora trebaš Anthropic API ključ.{'\n'}Dodaj ga u Profil → AI Coach → Claude API Key.
          </div>
          <button className="btn btn-primary" style={{ background: 'var(--purple)' }} onClick={() => setScreen('settings')}>
            <User size={16} />
            Idi na Profil → Unesi API ključ
          </button>
          <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-dimmer)', lineHeight: 1.6 }}>
            Ključ se čuva na tvojem accountu i sinhronizuje na svim uređajima.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: 'calc(var(--safe-top) + 14px) 14px 10px',
        background: 'var(--bg)',
        borderBottom: '0.5px solid var(--card-border)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--purple-dim)', border: '1.5px solid var(--purple)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 800, color: 'var(--purple)', letterSpacing: '-0.5px'
            }}>M</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>BRANI Mentor</div>
              <div style={{ fontSize: 11, color: 'var(--purple)' }}>● AI Coach · aktivan</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {memoryCount > 0 && (
              <div style={{ fontSize: 11, color: 'var(--purple)', background: 'var(--purple-dim)', padding: '3px 8px', borderRadius: 100, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Brain weight="fill" size={11} />{memoryCount}
              </div>
            )}
            {ttsSupported && (
              <button
                onClick={toggleTts}
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: ttsEnabled ? 'rgba(168,85,247,0.15)' : 'transparent',
                  border: `0.5px solid ${ttsEnabled ? 'rgba(168,85,247,0.4)' : 'var(--card-border)'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: ttsEnabled ? 'var(--purple)' : 'var(--text-dimmer)',
                  transition: 'all 0.15s',
                }}
              >
                {ttsEnabled ? <SpeakerHigh weight="fill" size={14} /> : <SpeakerX weight="fill" size={14} />}
              </button>
            )}
            <button
              onClick={handleClear}
              disabled={savingMemory}
              style={{ background: 'none', border: 'none', color: 'var(--text-dimmer)', cursor: savingMemory ? 'default' : 'pointer', fontSize: 12, padding: '4px 8px', borderRadius: 6 }}
            >
              {savingMemory ? '...' : (t?.delete_chat || 'Obriši')}
            </button>
          </div>
        </div>

        {/* Quick prompts */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => sendMessage(p.msg)}
              disabled={loading}
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 10px',
                borderRadius: 100,
                border: '0.5px solid var(--card-border)',
                background: 'var(--card)',
                color: 'var(--text-dim)',
                fontSize: 11, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >{p.icon} {p.label}</button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column' }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 14px',
        paddingBottom: 'calc(var(--nav-h) + var(--safe-bot) + 10px)',
        background: 'var(--bg)',
        borderTop: '0.5px solid var(--card-border)',
        flexShrink: 0
      }}>
        {listening && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 8, padding: '8px 12px',
            background: 'rgba(239,68,68,0.08)',
            border: '0.5px solid rgba(239,68,68,0.3)',
            borderRadius: 10,
            animation: 'voiceSlideUp 0.2s ease both',
          }}>
            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{
                  width: 2.5, borderRadius: 2,
                  background: '#ef4444',
                  animation: `pulse 0.7s ease ${i * 0.12}s infinite`,
                  height: `${8 + Math.sin(i) * 6 + 4}px`,
                }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
              Snimam... pritisni stop kad završiš
            </span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          {voiceSupported && (
            <MicButton listening={listening} onToggle={toggleVoice} disabled={loading} />
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder={listening ? 'Govorim...' : (t?.type_here || 'Napiši nešto...')}
            disabled={loading}
            rows={1}
            style={{
              flex: 1,
              background: listening ? 'rgba(239,68,68,0.04)' : 'var(--input-bg)',
              border: `0.5px solid ${listening ? 'rgba(239,68,68,0.4)' : 'var(--input-border)'}`,
              borderRadius: 12,
              color: 'var(--text)',
              fontFamily: 'inherit',
              fontSize: 14,
              padding: '10px 12px',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.5,
              overflow: 'hidden',
              minHeight: 44,
              transition: 'all 0.2s'
            }}
            onFocus={e => { if (!listening) e.target.style.borderColor = 'var(--purple)' }}
            onBlur={e => { if (!listening) e.target.style.borderColor = 'var(--input-border)' }}
          />
          <button
            onClick={() => { if (listening) { recognitionRef.current?.stop() } else { sendMessage(input) } }}
            disabled={loading || (!input.trim() && !listening)}
            style={{
              width: 44, height: 44,
              borderRadius: '50%',
              background: (input.trim() || listening) && !loading ? 'var(--purple)' : 'var(--card)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.15s'
            }}
          >
            {loading ? (
              <span className="spin" style={{ color: 'var(--purple)', fontSize: 16 }}>◌</span>
            ) : (
              <PaperPlaneTilt weight="fill" size={17} style={{ color: (input.trim() || listening) ? 'white' : 'var(--text-dimmer)', marginLeft: 1 }} />
            )}
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-dimmer)', textAlign: 'center', marginTop: 6 }}>
          {voiceSupported
            ? (listening ? 'Govori — pritisni crveno za stop, poruka se šalje automatski' : '🎤 klikni za glas · Enter = pošalji · Shift+Enter = novi red')
            : 'Enter = pošalji · Shift+Enter = novi red'
          }
        </div>
      </div>
    </div>
  )
}
