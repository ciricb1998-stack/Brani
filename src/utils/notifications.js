import { saveData, loadData, loadDayData, loadSettings, loadAIKey } from './storage.js'

const NOTIF_KEY = 'notif_settings'
const SHOWN_KEY = 'notif_shown'

export function saveNotifSettings(s) { return saveData(NOTIF_KEY, s) }

export function loadNotifSettings() {
  return loadData(NOTIF_KEY, {
    enabled: false,
    morning: '07:30',
    evening: '21:00',
    midday: '13:00',
    streakWarning: true,
    aiTip: true
  })
}

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  const result = await Notification.requestPermission()
  return result
}

export async function showNotif(title, body, opts = {}) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [150, 80, 150],
        tag: opts.tag || 'brani-notif',
        renotify: true,
        data: { url: '/' },
        ...opts,
      })
      return
    }
    const n = new Notification(title, { body, icon: '/icon-192.png' })
    n.onclick = () => { window.focus(); n.close() }
  } catch (e) {
    console.warn('Notification failed:', e)
  }
}

// ── Branded notification wrapper ──────────────────────────────────────────────
function notif(title, body, tag = 'brani-daily') {
  return showNotif(`BRANI · ${title}`, body, { tag })
}

// ── Morning message with task names ──────────────────────────────────────────
function getMorningMsg(todayData, lang) {
  const task1 = todayData.task1
  const task2 = todayData.task2
  const task3 = todayData.task3
  const hasTasks = task1 || task2 || task3

  const msgs = {
    bs: hasTasks
      ? `Plan je spreman:\n${[task1, task2, task3].filter(Boolean).map((t, i) => `${i+1}. ${t}`).join('\n')}`
      : '☀️ Novi dan. Unesi 3 zadatka koji se moraju završiti.',
    de: hasTasks
      ? `Plan steht:\n${[task1, task2, task3].filter(Boolean).map((t, i) => `${i+1}. ${t}`).join('\n')}`
      : '☀️ Neuer Tag. Trag 3 Aufgaben ein, die erledigt werden müssen.',
    en: hasTasks
      ? `Plan is set:\n${[task1, task2, task3].filter(Boolean).map((t, i) => `${i+1}. ${t}`).join('\n')}`
      : '☀️ New day. Enter 3 tasks that must get done.',
  }
  const s = loadSettings()
  return msgs[s.lang || 'bs'] || msgs.bs
}

// ── Midday message — remaining tasks ─────────────────────────────────────────
function getMiddayMsg(todayData, lang) {
  const remaining = []
  if (todayData.task1 && !todayData.task1Done) remaining.push(todayData.task1)
  if (todayData.task2 && !todayData.task2Done) remaining.push(todayData.task2)
  if (todayData.task3 && !todayData.task3Done) remaining.push(todayData.task3)

  if (remaining.length === 0) {
    const msgs = { bs: '✅ Svi zadaci završeni! Streak živi.', de: '✅ Alle Aufgaben erledigt! Streak lebt.', en: '✅ All tasks done! Streak alive.' }
    const s = loadSettings()
    return msgs[s.lang || 'bs']
  }

  const msgs = {
    bs: `🎯 Još ${remaining.length} zadataka:\n${remaining.map((t, i) => `${i+1}. ${t}`).join('\n')}`,
    de: `🎯 Noch ${remaining.length} Aufgaben:\n${remaining.map((t, i) => `${i+1}. ${t}`).join('\n')}`,
    en: `🎯 ${remaining.length} tasks left:\n${remaining.map((t, i) => `${i+1}. ${t}`).join('\n')}`,
  }
  const s = loadSettings()
  return msgs[s.lang || 'bs'] || msgs.bs
}

// ── Evening message ───────────────────────────────────────────────────────────
function getEveningMsg(todayData, lang) {
  const done = [todayData.task1Done, todayData.task2Done, todayData.task3Done].filter(Boolean).length
  const remaining = []
  if (todayData.task1 && !todayData.task1Done) remaining.push(todayData.task1)
  if (todayData.task2 && !todayData.task2Done) remaining.push(todayData.task2)
  if (todayData.task3 && !todayData.task3Done) remaining.push(todayData.task3)

  const s = loadSettings()
  const l = s.lang || 'bs'

  if (done === 3) {
    return { bs: '🔥 Sve 3! Savršen dan. Unesi refleksiju.', de: '🔥 Alle 3! Perfekter Tag. Schreib deine Reflexion.', en: '🔥 All 3! Perfect day. Write your reflection.' }[l]
  }
  if (remaining.length > 0) {
    const names = remaining.map((t, i) => `${i+1}. ${t}`).join('\n')
    return { bs: `⚡ ${done}/3 završeno. Još ima:\n${names}`, de: `⚡ ${done}/3 erledigt. Noch:\n${names}`, en: `⚡ ${done}/3 done. Remaining:\n${names}` }[l]
  }
  return { bs: '📝 Zapiši refleksiju za danas. Dan nije gotov bez nje.', de: '📝 Schreib deine Tagesreflexion. Der Tag ist ohne sie nicht fertig.', en: '📝 Write your daily reflection. The day isn\'t complete without it.' }[l]
}

// ── AI-powered tip (requires API key) ────────────────────────────────────────
async function getAITip() {
  const apiKey = loadAIKey()
  if (!apiKey) return getDailyTip()

  const today = new Date()
  const data = loadDayData(today)
  let streak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    const dd = loadDayData(d)
    if (dd.task1Done || dd.task2Done || dd.task3Done) streak++
    else if (i > 0) break
  }

  const context = `Streak: ${streak} dana. Zadaci danas: ${[data.task1, data.task2, data.task3].filter(Boolean).join(', ') || 'nisu uneti'}. Energija: ${data.energy || '?'}/10.`

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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        system: 'Ti si BRANI AI mentor. Napiši jednu kratku, konkretnu i motivišuću poruku (max 2 rečenice) na bosanskom jeziku. Bez floskula. Direktno.',
        messages: [{ role: 'user', content: `Kontekst: ${context}. Šta da mu kažeš jutros?` }]
      })
    })
    if (res.ok) {
      const data = await res.json()
      return data.content[0].text.trim()
    }
  } catch {}

  return getDailyTip()
}

// ── Fallback daily tip ────────────────────────────────────────────────────────
function getDailyTip() {
  const today = new Date()
  const data = loadDayData(today)
  let streak = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    const dd = loadDayData(d)
    if (dd.task1Done || dd.task2Done || dd.task3Done) streak++
    else if (i > 0) break
  }

  const s = loadSettings()
  const tips = {
    bs: [
      streak >= 7 ? `🔥 Dan ${streak} streak-a. Svaki dan koji dodaš postaje teže prekinuti.` : null,
      streak >= 21 ? `⚡ ${streak} dana! Ovo više nije navika — ovo je ko si.` : null,
      `🎯 Jedna stvar: koji je tvoj najvažniji zadatak za danas?`,
      `🏋️ Oporavak je aktivan rad. Uradi rehab.`,
      `📈 Kompanija se gradi svaki dan. Jedna akcija danas.`,
      `🧠 Disciplina = sloboda. Svaki put kad odabereš tešku stvar, jačaš.`,
      `⚽ Povratak na teren počinje s ovim navikama, ovim danima.`,
    ].filter(Boolean),
    de: [
      streak >= 7 ? `🔥 Tag ${streak}. Jeder Tag macht es schwerer aufzuhören.` : null,
      `🎯 Eine Sache: Was ist deine wichtigste Aufgabe heute?`,
      `💪 Disziplin = Freiheit. Tu die schwere Sache.`,
    ].filter(Boolean),
    en: [
      streak >= 7 ? `🔥 Day ${streak}. Every day you add makes it harder to quit.` : null,
      `🎯 One thing: what's your most important task today?`,
      `💪 Discipline = freedom. Choose the hard thing.`,
    ].filter(Boolean),
  }
  const list = tips[s.lang || 'bs']
  return list[Math.floor(Math.random() * list.length)] || tips.bs[0]
}

// ── Track shown notifications ─────────────────────────────────────────────────
function getShownToday() {
  try {
    const raw = sessionStorage.getItem(SHOWN_KEY)
    const data = raw ? JSON.parse(raw) : {}
    const today = new Date().toDateString()
    return data[today] || {}
  } catch { return {} }
}

function markShown(type) {
  try {
    const raw = sessionStorage.getItem(SHOWN_KEY)
    const data = raw ? JSON.parse(raw) : {}
    const today = new Date().toDateString()
    data[today] = { ...(data[today] || {}), [type]: true }
    sessionStorage.setItem(SHOWN_KEY, JSON.stringify(data))
  } catch {}
}

// ── Startup check ─────────────────────────────────────────────────────────────
export function checkAndNotify() {
  const cfg = loadNotifSettings()
  if (!cfg.enabled) return
  if (Notification.permission !== 'granted') return

  const now = new Date()
  const h = now.getHours()
  const shown = getShownToday()
  const todayData = loadDayData(now)

  if (h >= 7 && h < 12 && !shown.morning) {
    notif('Jutro', getMorningMsg(todayData, ''), 'brani-morning')
    markShown('morning')
    return
  }
  if (h >= 12 && h < 16 && !shown.midday) {
    const remaining = [todayData.task1, todayData.task2, todayData.task3].filter((t, i) => t && !todayData[`task${i+1}Done`]).length
    if (remaining > 0) {
      notif('Podsjetnik', getMiddayMsg(todayData, ''), 'brani-midday')
      markShown('midday')
    }
    return
  }
  if (h >= 19 && h < 23 && !shown.evening) {
    notif('Večernji check-in', getEveningMsg(todayData, ''), 'brani-evening')
    markShown('evening')
  }
}

export function scheduleDaily() {
  checkAndNotify()
  const interval = setInterval(checkAndNotify, 5 * 60 * 1000)
  const onVisible = () => { if (document.visibilityState === 'visible') checkAndNotify() }
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    clearInterval(interval)
    document.removeEventListener('visibilitychange', onVisible)
  }
}

// ── Main scheduler — called every minute from App.jsx ─────────────────────────
export function checkScheduledNotifications() {
  const cfg = loadNotifSettings()
  if (!cfg.enabled) return
  if (Notification.permission !== 'granted') return

  const now = new Date()
  const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const shown = getShownToday()
  const todayData = loadDayData(now)

  if (hhmm === cfg.morning && !shown.morning) {
    notif('Jutro', getMorningMsg(todayData, ''), 'brani-morning')
    markShown('morning')
  }

  if (hhmm === cfg.midday && cfg.streakWarning && !shown.midday) {
    const hasUndone = (todayData.task1 && !todayData.task1Done) || (todayData.task2 && !todayData.task2Done) || (todayData.task3 && !todayData.task3Done)
    if (hasUndone) {
      notif('Podsjetnik', getMiddayMsg(todayData, ''), 'brani-midday')
      markShown('midday')
    }
  }

  if (hhmm === cfg.evening && !shown.evening) {
    notif('Večernji check-in', getEveningMsg(todayData, ''), 'brani-evening')
    markShown('evening')
  }

  // AI tip 30 min after morning
  if (cfg.aiTip && !shown.tip) {
    const [mh, mm] = cfg.morning.split(':').map(Number)
    const tipM = (mm + 30) % 60
    const tipH = mm + 30 >= 60 ? mh + 1 : mh
    const tipTime = `${String(tipH).padStart(2,'0')}:${String(tipM).padStart(2,'0')}`
    if (hhmm === tipTime) {
      markShown('tip')
      getAITip().then(tip => {
        notif('BRANI Mentor', tip, 'brani-tip')
      })
    }
  }
}

// ── Send notification from AI (callable by AIAgentScreen) ────────────────────
export async function sendAINotification(title, body) {
  if (Notification.permission !== 'granted') {
    const perm = await requestPermission()
    if (perm !== 'granted') return false
  }
  await notif(title, body, 'brani-ai-msg')
  return true
}
