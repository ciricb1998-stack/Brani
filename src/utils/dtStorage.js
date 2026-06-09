import { syncSave } from './sync.js'
import { supabase } from './supabase.js'

// ── Mentor token ───────────────────────────────────────────────────────────────
const MENTOR_KEY = 'brani_dt_mentor_token'

export function getMentorToken() {
  let t = localStorage.getItem(MENTOR_KEY)
  if (!t) {
    t = Math.random().toString(36).slice(2,6).toUpperCase() +
        Math.random().toString(36).slice(2,6).toUpperCase()
    localStorage.setItem(MENTOR_KEY, t)
  }
  return t
}

export async function pushMentorData() {
  const token = getMentorToken()
  const tickets  = loadTickets().slice(0,100).map(t => ({ number:t.number, title:t.title, status:t.status, priority:t.priority, createdAt:t.createdAt, resolvedAt:t.resolvedAt, assignee:t.assignee, desc:(t.desc||'').slice(0,300) }))
  const devices  = loadDevices().map(d => ({ rNumber:d.rNumber, name:d.name, type:d.type, status:d.status, userName:d.userName, location:d.location, model:d.model }))
  const wiki     = loadWiki().slice(0,30).map(e => ({ title:e.title, tag:e.tag, hits:e.hits||0, verified:!!e.verified }))
  const wartungen= loadWartungen().slice(0,30).map(w => ({ title:w.title, type:w.type, date:w.date, status:w.status }))
  try {
    await supabase.from('mentor_data').upsert({
      token, tickets, devices, wiki, wartungen, updated_at: new Date().toISOString()
    }, { onConflict: 'token' })
  } catch(e) { console.warn('mentor push failed', e) }
}

const P = 'brani_'

function load(key, fb = []) {
  try { return JSON.parse(localStorage.getItem(P + key)) ?? fb } catch { return fb }
}
function persist(key, data) {
  localStorage.setItem(P + key, JSON.stringify(data))
  syncSave(key, data).catch(() => {})
}

// ── SLA definitions (minutes) ─────────────────────────────────────────────────
export const SLA_LIMITS = {
  kritisch: { response: 15,  resolution: 60   },
  hoch:     { response: 60,  resolution: 240  },
  mittel:   { response: 240, resolution: 480  },
  niedrig:  { response: 480, resolution: 1440 },
}

export function getSLAStatus(ticket) {
  if (ticket.status === 'done') return { state: 'met', label: 'Erledigt', color: '#22C55E' }
  const limits = SLA_LIMITS[ticket.priority] || SLA_LIMITS.mittel
  const now = Date.now()
  const created = new Date(ticket.createdAt).getTime()
  const elapsedMin = (now - created) / 60000
  const resLimit = limits.resolution
  const remaining = resLimit - elapsedMin
  const pct = elapsedMin / resLimit

  if (pct >= 1)    return { state: 'breached', label: `+${Math.round(elapsedMin - resLimit)}m überfällig`, color: '#EF4444', pct: 1 }
  if (pct >= 0.75) return { state: 'warning',  label: `${Math.round(remaining)}m verbleibend`, color: '#F97316', pct }
  return { state: 'ok', label: `${Math.round(remaining)}m`, color: '#22C55E', pct }
}

// ── ID helpers ─────────────────────────────────────────────────────────────────
function nextNum(arr, field, prefix) {
  const max = arr.reduce((m, x) => {
    const n = parseInt((x[field] || '').replace(prefix + '-', '')) || 0
    return Math.max(m, n)
  }, 0)
  return `${prefix}-${String(max + 1).padStart(4, '0')}`
}

// ── Tickets ────────────────────────────────────────────────────────────────────
export function loadTickets() { return load('dt_tickets') }
export function saveTickets(d) { persist('dt_tickets', d) }

export function createTicket(f) {
  const all = loadTickets()
  const t = {
    id: Date.now().toString(),
    number: nextNum(all, 'number', 'T'),
    createdAt: new Date().toISOString(),
    status: 'open', priority: 'mittel',
    statusHistory: [{ status: 'open', at: new Date().toISOString() }],
    ...f,
    photos: [], // photos not synced to Supabase (size)
  }
  const saved = load('dt_tickets_photos')
  saved[t.id] = f.photos || []
  localStorage.setItem(P + 'dt_tickets_photos', JSON.stringify(saved))
  saveTickets([t, ...all])
  return t
}

export function updateTicket(id, patch) {
  const all = loadTickets()
  const updated = all.map(t => {
    if (t.id !== id) return t
    const history = [...(t.statusHistory || [])]
    if (patch.status && patch.status !== t.status) {
      history.push({ status: patch.status, at: new Date().toISOString() })
    }
    const merged = { ...t, ...patch, statusHistory: history }
    // photos stored separately
    if (patch.photos !== undefined) {
      const ph = load('dt_tickets_photos', {})
      ph[id] = patch.photos
      localStorage.setItem(P + 'dt_tickets_photos', JSON.stringify(ph))
      delete merged.photos
    }
    return merged
  })
  saveTickets(updated)
}

export function getTicketPhotos(id) {
  const ph = load('dt_tickets_photos', {})
  return ph[id] || []
}
export function setTicketPhotos(id, photos) {
  const ph = load('dt_tickets_photos', {})
  ph[id] = photos
  localStorage.setItem(P + 'dt_tickets_photos', JSON.stringify(ph))
}

export function deleteTicket(id) {
  const ph = load('dt_tickets_photos', {})
  delete ph[id]
  localStorage.setItem(P + 'dt_tickets_photos', JSON.stringify(ph))
  saveTickets(loadTickets().filter(t => t.id !== id))
}

// ── Devices ────────────────────────────────────────────────────────────────────
export function loadDevices() { return load('dt_devices') }
export function saveDevices(d) { persist('dt_devices', d) }

export function createDevice(f) {
  const all = loadDevices()
  const d = {
    id: Date.now().toString(),
    rNumber: f.rNumber || nextNum(all, 'rNumber', 'R'),
    createdAt: new Date().toISOString(), status: 'aktiv',
    ...f, photos: [],
  }
  const ph = load('dt_devices_photos', {})
  ph[d.id] = f.photos || []
  localStorage.setItem(P + 'dt_devices_photos', JSON.stringify(ph))
  saveDevices([d, ...all])
  return d
}
export function updateDevice(id, patch) {
  if (patch.photos !== undefined) {
    const ph = load('dt_devices_photos', {})
    ph[id] = patch.photos
    localStorage.setItem(P + 'dt_devices_photos', JSON.stringify(ph))
  }
  saveDevices(loadDevices().map(d => d.id === id ? { ...d, ...patch, photos: undefined } : d))
}
export function getDevicePhotos(id) { return (load('dt_devices_photos', {}))[id] || [] }
export function deleteDevice(id) {
  const ph = load('dt_devices_photos', {})
  delete ph[id]
  localStorage.setItem(P + 'dt_devices_photos', JSON.stringify(ph))
  saveDevices(loadDevices().filter(d => d.id !== id))
}

// ── Wissensdatenbank ───────────────────────────────────────────────────────────
export function loadWiki() { return load('dt_wiki') }
export function saveWiki(d) { persist('dt_wiki', d) }
export function createWikiEntry(f) {
  const all = loadWiki()
  const e = { id: Date.now().toString(), createdAt: new Date().toISOString(), hits: 0, verified: false, ...f }
  saveWiki([e, ...all]); return e
}
export function updateWikiEntry(id, patch) { saveWiki(loadWiki().map(e => e.id === id ? { ...e, ...patch } : e)) }
export function deleteWikiEntry(id) { saveWiki(loadWiki().filter(e => e.id !== id)) }
export function hitWikiEntry(id) { updateWikiEntry(id, { hits: (loadWiki().find(e => e.id === id)?.hits || 0) + 1 }) }

// ── Wartungsplan ───────────────────────────────────────────────────────────────
export function loadWartungen() { return load('dt_wartungen') }
export function saveWartungen(d) { persist('dt_wartungen', d) }
export function createWartung(f) {
  const all = loadWartungen()
  const w = { id: Date.now().toString(), createdAt: new Date().toISOString(), status: 'geplant', ...f }
  saveWartungen([w, ...all]); return w
}
export function updateWartung(id, patch) { saveWartungen(loadWartungen().map(w => w.id === id ? { ...w, ...patch } : w)) }
export function deleteWartung(id) { saveWartungen(loadWartungen().filter(w => w.id !== id)) }

// ── Schichtbericht ─────────────────────────────────────────────────────────────
export function getTodayActivity() {
  const todayStr = new Date().toDateString()
  const tickets = loadTickets()
  const devices = loadDevices()
  const wiki = loadWiki()

  const openedToday = tickets.filter(t => new Date(t.createdAt).toDateString() === todayStr)
  const resolvedToday = tickets.filter(t => t.resolvedAt && new Date(t.resolvedAt).toDateString() === todayStr)
  const inProgressToday = tickets.filter(t => {
    const last = (t.statusHistory || []).find(h => h.status === 'in_progress' && new Date(h.at).toDateString() === todayStr)
    return !!last
  })
  const devicesAddedToday = devices.filter(d => new Date(d.createdAt).toDateString() === todayStr)
  const wikiAddedToday = wiki.filter(e => new Date(e.createdAt).toDateString() === todayStr)

  return { openedToday, resolvedToday, inProgressToday, devicesAddedToday, wikiAddedToday }
}

// ── Mentor share ───────────────────────────────────────────────────────────────
export function generateMentorSnapshot() {
  const tickets = loadTickets().slice(0, 50).map(t => ({
    number: t.number, title: t.title, status: t.status,
    priority: t.priority, createdAt: t.createdAt, resolvedAt: t.resolvedAt,
    assignee: t.assignee,
  }))
  const devices = loadDevices().slice(0, 100).map(d => ({
    rNumber: d.rNumber, name: d.name, type: d.type,
    status: d.status, userName: d.userName, location: d.location,
  }))
  const wiki = loadWiki().slice(0, 20).map(e => ({
    title: e.title, tag: e.tag, hits: e.hits,
  }))
  const snap = { tickets, devices, wiki, generatedAt: new Date().toISOString(), by: 'Branislav Ćirić — Dans-Tech GmbH' }
  return btoa(unescape(encodeURIComponent(JSON.stringify(snap))))
}
