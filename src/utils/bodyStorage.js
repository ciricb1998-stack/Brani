import { saveData, loadData } from './storage.js'

const KEY_ENTRIES = 'body_entries'
const KEY_INJURY = 'body_injury'

export function loadBodyEntries() { return loadData(KEY_ENTRIES, []) }
export function saveBodyEntries(list) { saveData(KEY_ENTRIES, list) }

export function addBodyEntry(entry) {
  const list = loadBodyEntries()
  const existing = list.findIndex(e => e.date === entry.date)
  if (existing !== -1) {
    list[existing] = { ...list[existing], ...entry }
  } else {
    list.unshift({ ...entry, id: Date.now().toString() })
  }
  saveBodyEntries(list)
}

export function deleteBodyEntry(id) { saveBodyEntries(loadBodyEntries().filter(e => e.id !== id)) }

export function loadInjuryLog() { return loadData(KEY_INJURY, { description: '', startDate: '', targetDate: '', phase: 'rehab', notes: '', sessions: [] }) }
export function saveInjuryLog(data) { saveData(KEY_INJURY, data) }

export function addPhysioSession(session) {
  const inj = loadInjuryLog()
  const sessions = [{ ...session, id: Date.now().toString() }, ...(inj.sessions || [])]
  saveInjuryLog({ ...inj, sessions })
}

export function deletePhysioSession(id) {
  const inj = loadInjuryLog()
  saveInjuryLog({ ...inj, sessions: (inj.sessions || []).filter(s => s.id !== id) })
}
