import {
  loadDayData, loadYearlyGoal, loadMonthlyGoals,
  loadCaptures, loadBDLClients, loadBDLMeetings,
  loadFootballProfile, loadRecoverySessions,
  loadSettings, loadAIKey,
} from './storage.js'

function today() { return new Date() }
function dateStr(d = new Date()) { return d.toISOString().split('T')[0] }
function weekNum(d = new Date()) {
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
}

export function buildContext() {
  const now = today()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const todayStr = dateStr(now)
  const lines = []

  // ── Datum & dan ──
  const days = ['Nedjelja','Ponedjeljak','Utorak','Srijeda','Četvrtak','Petak','Subota']
  lines.push(`Danas: ${days[now.getDay()]}, ${now.toLocaleDateString('de-DE')}`)

  // ── Streak ──
  const settings = loadSettings()
  if (settings?.streak) lines.push(`Streak: ${settings.streak} dana`)

  // ── Planner ──
  const dayData = loadDayData(todayStr)
  if (dayData) {
    if (dayData.tasks?.length) {
      const tasks = dayData.tasks.filter(Boolean)
      const done = dayData.tasksDone || []
      lines.push(`Dnevni plan (${done.length}/${tasks.length} završeno):`)
      tasks.forEach((t, i) => lines.push(`  ${done.includes(i) ? '✓' : '○'} ${t}`))
    }
    if (dayData.energy) lines.push(`Energija danas: ${dayData.energy}/10`)
    if (dayData.sleep) lines.push(`San: ${dayData.sleep}h`)
  }

  // ── Godišnji ciljevi ──
  const yearly = loadYearlyGoal(year)
  if (yearly) {
    lines.push(`\nGodišnji ciljevi ${year}:`)
    if (yearly.vision)   lines.push(`  Vizija: ${yearly.vision}`)
    if (yearly.business) lines.push(`  Biznis: ${yearly.business}`)
    if (yearly.football) lines.push(`  Fudbal: ${yearly.football}`)
    if (yearly.health)   lines.push(`  Zdravlje: ${yearly.health}`)
    if (yearly.personal) lines.push(`  Lično: ${yearly.personal}`)
  }

  // ── Mjesečni ciljevi ──
  const monthly = loadMonthlyGoals(year, month)
  if (monthly?.length) {
    lines.push(`\nMjesečni ciljevi (${month}/${year}):`)
    monthly.filter(Boolean).forEach(g => lines.push(`  • ${g}`))
  }

  // ── Captures (zadnjih 5) ──
  const captures = loadCaptures().slice(0, 5)
  if (captures.length) {
    lines.push(`\nZadnje ideje/capture:`)
    captures.forEach(c => lines.push(`  • [${c.tag}] ${c.text.replace('🎤 ', '')}`))
  }

  // ── BDL klijenti ──
  const clients = loadBDLClients()
  if (clients.length) {
    lines.push(`\nBDL klijenti (${clients.length} ukupno):`)
    clients.slice(0, 5).forEach(c => lines.push(`  • ${c.name} — ${c.status || 'aktivan'}`))
  }

  // ── Meetings (nadolazeći) ──
  const meetings = loadBDLMeetings()
    .filter(m => m.date && new Date(m.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)
  if (meetings.length) {
    lines.push(`\nNadolazeći meetinzi:`)
    meetings.forEach(m => lines.push(`  • ${m.title} — ${new Date(m.date).toLocaleDateString('de-DE')}`))
  }

  // ── Football profil ──
  const fp = loadFootballProfile()
  if (fp) {
    lines.push(`\nFudbalski profil:`)
    if (fp.currentPhase) lines.push(`  Faza: ${fp.currentPhase}`)
    if (fp.position)     lines.push(`  Pozicija: ${fp.position}`)
    if (fp.targetDate)   lines.push(`  Cilj povratka: ${fp.targetDate}`)
  }

  // ── Recovery ──
  const recovery = loadRecoverySessions().slice(-3)
  if (recovery.length) {
    lines.push(`\nZadnji recovery sesija:`)
    recovery.forEach(r => lines.push(`  • ${dateStr(new Date(r.date || r.createdAt || Date.now()))}: ${r.type || 'sesija'}`))
  }

  return lines.join('\n')
}

export function loadBraniProfile() {
  try { return JSON.parse(localStorage.getItem('brani_ai_profile') || 'null') } catch { return null }
}

export function saveBraniProfile(p) {
  localStorage.setItem('brani_ai_profile', JSON.stringify(p))
}

export async function askBrani(message) {
  const apiKey = loadAIKey()
  if (!apiKey) return { reply: null, error: 'Kein Claude API Key. Bitte in Profil eintragen.' }

  const context = buildContext()
  const profile = loadBraniProfile()

  try {
    const r = await fetch('/api/brani-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context, profile, api_key: apiKey }),
    })
    const data = await r.json()
    if (!r.ok) return { reply: null, error: data.error }
    return { reply: data.reply, error: null }
  } catch (e) {
    return { reply: null, error: e.message }
  }
}
