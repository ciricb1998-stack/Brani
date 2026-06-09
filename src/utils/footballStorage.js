import { saveData, loadData } from './storage.js'

export function saveFootballProfile(p) { saveData('football_profile', p) }
export function loadFootballProfile() {
  return loadData('football_profile', {
    name: '', club: '', logo: '', position: '', contractUntil: '', returnDate: '', fupaUrl: '', number: '',
  })
}

export function saveMatches(list) { saveData('football_matches', list) }
export function loadMatches() { return loadData('football_matches', []) }
export function addMatch(m) {
  const list = loadMatches()
  list.unshift({ ...m, id: Date.now().toString() })
  saveMatches(list)
}
export function updateMatch(id, data) {
  saveMatches(loadMatches().map(m => m.id === id ? { ...m, ...data } : m))
}
export function deleteMatch(id) {
  saveMatches(loadMatches().filter(m => m.id !== id))
}

export function saveTrainings(list) { saveData('football_trainings', list) }
export function loadTrainings() { return loadData('football_trainings', []) }
export function addTraining(t) {
  const list = loadTrainings()
  list.unshift({ ...t, id: Date.now().toString() })
  saveTrainings(list)
}
export function updateTraining(id, data) {
  saveTrainings(loadTrainings().map(t => t.id === id ? { ...t, ...data } : t))
}
export function deleteTraining(id) {
  saveTrainings(loadTrainings().filter(t => t.id !== id))
}

export function loadTransferTargets() { return loadData('football_transfers', []) }
export function saveTransferTargets(list) { saveData('football_transfers', list) }
export function addTransferTarget(t) {
  const list = loadTransferTargets()
  list.unshift({ ...t, id: Date.now().toString(), createdAt: new Date().toISOString() })
  saveTransferTargets(list)
}
export function deleteTransferTarget(id) {
  saveTransferTargets(loadTransferTargets().filter(t => t.id !== id))
}
export function updateTransferTarget(id, data) {
  saveTransferTargets(loadTransferTargets().map(t => t.id === id ? { ...t, ...data } : t))
}

export function calcSeasonStats(matches) {
  return matches.reduce((acc, m) => ({
    games: acc.games + 1,
    minutes: acc.minutes + (parseInt(m.minutes) || 0),
    goals: acc.goals + (parseInt(m.goals) || 0),
    assists: acc.assists + (parseInt(m.assists) || 0),
    wins: acc.wins + (m.result === 'win' ? 1 : 0),
    draws: acc.draws + (m.result === 'draw' ? 1 : 0),
    losses: acc.losses + (m.result === 'loss' ? 1 : 0),
  }), { games: 0, minutes: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0 })
}
