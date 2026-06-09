// ── Alarm state ────────────────────────────────────────────────────────────────
let audioCtx = null
let gainNode = null
let beepTimer = null
let escalateTimer = null
let alarmFiring = false
let speechAudio = null

// ── Storage ───────────────────────────────────────────────────────────────────
export function loadAlarm() {
  try { return JSON.parse(localStorage.getItem('brani_alarm') || 'null') } catch { return null }
}
export function saveAlarm(data) {
  localStorage.setItem('brani_alarm', JSON.stringify(data))
}

function getKey() {
  const raw = localStorage.getItem('brani_elevenlabs_key')
  if (!raw) return ''
  try { return JSON.parse(raw) || '' } catch { return raw }
}

// ── ElevenLabs voices ─────────────────────────────────────────────────────────
export async function fetchElevenLabsVoices() {
  const key = getKey()
  if (!key) return { voices: [], error: 'no_key' }
  try {
    const r = await fetch('/api/elevenlabs-voices', {
      headers: { 'x-elevenlabs-key': key },
    })
    const data = await r.json()
    if (!r.ok) return { voices: [], error: data.error || `HTTP ${r.status}` }
    return { voices: data.voices || [], error: null }
  } catch (e) { return { voices: [], error: e.message } }
}

// ── ElevenLabs TTS ────────────────────────────────────────────────────────────
export async function speakElevenLabs(text, voiceId) {
  const key = getKey()
  if (!key) return null
  try {
    const r = await fetch('/api/elevenlabs-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice_id: voiceId, api_key: key }),
    })
    if (!r.ok) return null
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.volume = 1
    speechAudio = audio
    await audio.play()
    return new Promise(resolve => {
      audio.onended = resolve
      audio.onerror = resolve
    })
  } catch { return null }
}

// Preview (used in AlarmScreen)
export async function previewVoice(text, voiceId) {
  await speakElevenLabs(text, voiceId)
}

// ── Audio alarm (escalating beeps) ───────────────────────────────────────────
function startAudio(initialVol = 0.12) {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    gainNode = audioCtx.createGain()
    gainNode.gain.value = initialVol
    gainNode.connect(audioCtx.destination)

    let vol = initialVol
    function beepPair() {
      if (!alarmFiring || !audioCtx) return
      const o1 = audioCtx.createOscillator()
      o1.type = 'sine'; o1.frequency.value = 880
      o1.connect(gainNode); o1.start(); o1.stop(audioCtx.currentTime + 0.18)
      const o2 = audioCtx.createOscillator()
      o2.type = 'sine'; o2.frequency.value = 1100
      o2.connect(gainNode); o2.start(audioCtx.currentTime + 0.28); o2.stop(audioCtx.currentTime + 0.46)
      beepTimer = setTimeout(beepPair, 1600)
    }
    beepPair()

    escalateTimer = setInterval(() => {
      vol = Math.min(vol + 0.11, 1.0)
      if (gainNode) gainNode.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.8)
    }, 18000)
  } catch {}
}

function stopAudio() {
  clearTimeout(beepTimer); clearInterval(escalateTimer)
  beepTimer = null; escalateTimer = null
  if (speechAudio) { try { speechAudio.pause() } catch {}; speechAudio = null }
  if (audioCtx) { try { audioCtx.close() } catch {}; audioCtx = null; gainNode = null }
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function fireAlarm(alarm) {
  if (alarmFiring) return
  alarmFiring = true

  if (alarm.text?.trim()) {
    await speakElevenLabs(alarm.text, alarm.voiceId)
  }

  if (alarmFiring) startAudio(0.12)
}

export function stopAlarm() {
  alarmFiring = false
  speechSynthesis.cancel()
  stopAudio()
}

export function snoozeAlarm() {
  stopAlarm()
  localStorage.setItem('brani_snooze_until', String(Date.now() + 10 * 60 * 1000))
}

export function isAlarmFiring() { return alarmFiring }

// ── Check (called every minute from App) ──────────────────────────────────────
export function shouldFireAlarm() {
  const snoozeUntil = Number(localStorage.getItem('brani_snooze_until') || 0)
  if (Date.now() < snoozeUntil) return false

  const alarm = loadAlarm()
  if (!alarm?.enabled || !alarm?.time) return false

  const now = new Date()
  const [h, m] = alarm.time.split(':').map(Number)
  if (now.getHours() !== h || now.getMinutes() !== m) return false
  if (alarm.days?.length && !alarm.days.includes(now.getDay())) return false

  const key = `${now.toDateString()}_${h}:${m}`
  if (localStorage.getItem('brani_alarm_fired') === key) return false
  localStorage.setItem('brani_alarm_fired', key)
  return true
}
