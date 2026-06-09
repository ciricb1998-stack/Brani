import { syncSave } from './sync.js'

const PREFIX = 'brani_'

export function saveData(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data))
    syncSave(key, data)
    return true
  }
  catch (e) { console.error('Save failed:', e); return false }
}

export function loadData(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

export function removeData(key) { localStorage.removeItem(PREFIX + key) }

// ── Daily ─────────────────────────────────────────────────────────────────────
export function dailyKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  return `daily_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function saveDayData(date, data) { return saveData(dailyKey(date), data) }

export function loadDayData(date) {
  return loadData(dailyKey(date), {
    feeling: '', energy: '', sleep: '',
    morningRoutine: false, workout: false, meditation: false,
    task1: '', task1Done: false,
    task2: '', task2Done: false,
    task3: '', task3Done: false,
    wins: '', challenges: '', gratitude: '', notes: ''
  })
}

// ── Weekly ────────────────────────────────────────────────────────────────────
export function weeklyKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil((((d - jan1) / 86400000) + jan1.getDay() + 1) / 7)
  return `weekly_${d.getFullYear()}-W${String(week).padStart(2,'0')}`
}

export function saveWeekData(date, data) { return saveData(weeklyKey(date), data) }

export function loadWeekData(date) {
  return loadData(weeklyKey(date), {
    goal1: '', goal2: '', goal3: '',
    revenue: '', clients: '', projects: '',
    reflection: '', nextWeekFocus: '', score: ''
  })
}

// ── Morning Routine Config ────────────────────────────────────────────────────
export function saveRoutineConfig(items) { return saveData('routine_config', items) }
export function loadRoutineConfig() {
  return loadData('routine_config', [
    { id: 'morningRoutine', label: 'Jutarnja rutina', icon: 'morning', builtin: true },
    { id: 'workout', label: 'Trening', icon: 'workout', builtin: true },
    { id: 'meditation', label: 'Meditacija', icon: 'meditation', builtin: true },
  ])
}

// ── Custom Habits ─────────────────────────────────────────────────────────────
export function saveHabits(habits) { return saveData('habits_config', habits) }

export function loadHabits() {
  return loadData('habits_config', [
    { id: 'h1', name: 'Čitanje', icon: 'reading' },
    { id: 'h2', name: 'Hladni tuš', icon: 'shower' },
    { id: 'h3', name: 'Vitamini', icon: 'vitamins' },
    { id: 'h4', name: 'Šetnja', icon: 'walk' }
  ])
}

function habitLogKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  return `hlog_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function saveHabitLog(date, log) { return saveData(habitLogKey(date), log) }
export function loadHabitLog(date) { return loadData(habitLogKey(date), {}) }

// ── Goals — Monthly ───────────────────────────────────────────────────────────
export function saveMonthlyGoals(year, month, goals) {
  return saveData(`goals_m_${year}-${String(month).padStart(2,'0')}`, goals)
}

export function loadMonthlyGoals(year, month) {
  return loadData(`goals_m_${year}-${String(month).padStart(2,'0')}`, [])
}

// ── Goals — Quarterly ─────────────────────────────────────────────────────────
export function saveQuarterlyGoal(year, q, data) {
  return saveData(`goals_q_${year}-Q${q}`, data)
}

export function loadQuarterlyGoal(year, q) {
  return loadData(`goals_q_${year}-Q${q}`, { text: '', done: false })
}

// ── Goals — Yearly ────────────────────────────────────────────────────────────
export function saveYearlyGoal(year, data) { return saveData(`goals_y_${year}`, data) }

export function loadYearlyGoal(year) {
  return loadData(`goals_y_${year}`, {
    vision: '', business: '', football: '', health: '', personal: ''
  })
}

// ── Football / Recovery ───────────────────────────────────────────────────────
function footballKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  return `football_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function saveFootballLog(date, data) { return saveData(footballKey(date), data) }

export function loadFootballLog(date) {
  return loadData(footballKey(date), { type: '', duration: '', pain: 0, notes: '', done: false })
}

export function loadFootballMonth(year, month) {
  const logs = []
  const days = new Date(year, month, 0).getDate()
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month - 1, d)
    const log = loadFootballLog(date)
    if (log.done || log.type) logs.push({ date: new Date(date), ...log })
  }
  return logs
}

export function saveFootballProfile(data) { return saveData('football_profile', data) }

export function loadFootballProfile() {
  return loadData('football_profile', {
    injuryType: '', injuryDate: '', targetReturn: '', phase: 'rehab', notes: ''
  })
}

// ── AI ────────────────────────────────────────────────────────────────────────
export async function saveAIKey(key) {
  saveData('ai_key', key)
  const { syncSave } = await import('./sync.js')
  syncSave('ai_key', key)
}
export function loadAIKey() { return loadData('ai_key', '') }

export function saveChatHistory(messages) { return saveData('chat_history', messages) }
export function loadChatHistory() { return loadData('chat_history', []) }
export function clearChatHistory() { return saveData('chat_history', []) }

// ── AI Memory (persistent across sessions) ────────────────────────────────────
export function saveMemoryEntries(entries) { return saveData('ai_memory', entries) }
export function loadMemoryEntries() { return loadData('ai_memory', []) }
export function addMemoryEntry(entry) {
  const entries = loadMemoryEntries()
  entries.push({ ...entry, ts: Date.now() })
  // Keep last 60 entries (2 months daily use)
  if (entries.length > 60) entries.splice(0, entries.length - 60)
  return saveData('ai_memory', entries)
}
export function clearMemory() { return saveData('ai_memory', []) }

// ── Settings ──────────────────────────────────────────────────────────────────
export function saveSettings(s) { return saveData('settings', s) }

export function loadSettings() {
  return loadData('settings', { brand: 'brani', lang: 'bs', theme: 'dark' })
}

// ── Export / Import ───────────────────────────────────────────────────────────
export function exportAllData() {
  const all = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith(PREFIX)) {
      try { all[key.replace(PREFIX, '')] = JSON.parse(localStorage.getItem(key)) }
      catch { all[key.replace(PREFIX, '')] = localStorage.getItem(key) }
    }
  }
  return all
}

export function importAllData(data) {
  try {
    Object.entries(data).forEach(([key, val]) => {
      localStorage.setItem(PREFIX + key, JSON.stringify(val))
    })
    return true
  } catch (e) { console.error('Import failed:', e); return false }
}

// ── LOG — Channels ─────────────────────────────────────────────────────────────
export function saveLogChannels(ch) { return saveData('log_channels', ch) }
export function loadLogChannels() {
  return loadData('log_channels', [
    { id: 'yt', platform: 'youtube', name: 'YouTube', handle: '', url: '', followers: 0, target: 1000 },
    { id: 'li', platform: 'linkedin', name: 'LinkedIn', handle: '', url: '', followers: 0, target: 500 },
    { id: 'ig', platform: 'instagram', name: 'Instagram', handle: '', url: '', followers: 0, target: 1000 },
    { id: 'tt', platform: 'tiktok', name: 'TikTok', handle: '', url: '', followers: 0, target: 500 },
  ])
}

// ── LOG — Content ──────────────────────────────────────────────────────────────
export function saveLogContent(entries) { return saveData('log_content', entries) }
export function loadLogContent() { return loadData('log_content', []) }

// ── LOG — Stat Snapshots ───────────────────────────────────────────────────────
export function saveLogStatSnaps(snaps) { return saveData('log_stat_snaps', snaps) }
export function loadLogStatSnaps() { return loadData('log_stat_snaps', []) }

// ── BDL — Clients ─────────────────────────────────────────────────────────────
export function saveBDLClients(c) { return saveData('bdl_clients', c) }
export function loadBDLClients() { return loadData('bdl_clients', []) }

// ── BDL — Meetings ────────────────────────────────────────────────────────────
export function saveBDLMeetings(m) { return saveData('bdl_meetings', m) }
export function loadBDLMeetings() { return loadData('bdl_meetings', []) }

// ── BDL — Projects ────────────────────────────────────────────────────────────
export function saveBDLProjects(p) { return saveData('bdl_projects', p) }
export function loadBDLProjects() { return loadData('bdl_projects', []) }

// ── Pipeline ──────────────────────────────────────────────────────────────────
export function savePipeline(d) { return saveData('pipeline', d) }
export function loadPipeline() { return loadData('pipeline', []) }

// ── Finance ───────────────────────────────────────────────────────────────────
export function saveFinance(d) { return saveData('finance', d) }
export function loadFinance() { return loadData('finance', { income: [], expenses: [] }) }

// ── Quick Capture ─────────────────────────────────────────────────────────────
export function saveCaptures(d) { return saveData('captures', d) }
export function loadCaptures() { return loadData('captures', []) }

// ── Recovery Sessions ─────────────────────────────────────────────────────────
export function saveRecoverySessions(d) { return saveData('recovery_sessions', d) }
export function loadRecoverySessions() { return loadData('recovery_sessions', []) }

// ── Weekly Review ─────────────────────────────────────────────────────────────
export function saveWeeklyReview(year, week, d) { return saveData(`weekly_review_${year}-W${String(week).padStart(2,'0')}`, d) }
export function loadWeeklyReview(year, week) { return loadData(`weekly_review_${year}-W${String(week).padStart(2,'0')}`, {}) }

// ── Vocab Incubator ───────────────────────────────────────────────────────────
export function saveVocab(d) { return saveData('vocab', d) }
export function loadVocab() { return loadData('vocab', []) }
