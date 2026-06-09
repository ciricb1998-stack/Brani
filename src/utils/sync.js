import { supabase } from './supabase.js'

let _userId = null

export function setSyncUser(uid) { _userId = uid }
export function clearSyncUser() { _userId = null }

const SKIP_KEYS = new Set([])

export async function syncSave(key, value) {
  if (!_userId || SKIP_KEYS.has(key)) return
  try {
    await supabase.from('user_data').upsert(
      { user_id: _userId, key, value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' }
    )
  } catch (e) {
    console.warn('Sync save failed:', e)
  }
}

export async function syncLoadAll() {
  if (!_userId) return {}
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('key, value')
      .eq('user_id', _userId)
    if (error || !data) return {}
    const result = {}
    data.forEach(row => { result[row.key] = row.value })
    return result
  } catch {
    return {}
  }
}

export function subscribeSync(onUpdate) {
  if (!_userId) return null
  return supabase
    .channel('user_data_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_data', filter: `user_id=eq.${_userId}` },
      (payload) => {
        if (payload.new?.key) onUpdate(payload.new.key, payload.new.value)
      }
    )
    .subscribe()
}
