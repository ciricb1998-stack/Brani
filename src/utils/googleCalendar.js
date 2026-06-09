const CLIENT_ID = '745249082866-v4mlfb7vagi3nvmo80ojf411mj87orbn.apps.googleusercontent.com'
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'
const TOKEN_KEY = 'gc_token'
const EXP_KEY   = 'gc_token_exp'
const WAS_KEY   = 'gc_was_connected' // persists forever — signals silent refresh on startup

let tokenClient  = null
let refreshTimer = null
let _onReady     = null // latest callback from initGoogleAuth

// ── Token helpers ──────────────────────────────────────────────────────────────

export function isConnected() {
  const token = localStorage.getItem(TOKEN_KEY)
  const exp   = localStorage.getItem(EXP_KEY)
  return !!(token && exp && Date.now() < Number(exp))
}

export function getToken() {
  return isConnected() ? localStorage.getItem(TOKEN_KEY) : null
}

function storeToken(res) {
  if (!res.access_token) return false
  const exp = Date.now() + res.expires_in * 1000
  localStorage.setItem(TOKEN_KEY, res.access_token)
  localStorage.setItem(EXP_KEY, String(exp))
  localStorage.setItem(WAS_KEY, '1')
  scheduleRefresh(exp)
  return true
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXP_KEY)
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null }
}

// ── Auto-refresh timer ─────────────────────────────────────────────────────────
// Fires 5 minutes before expiry — silently gets a new token

function scheduleRefresh(expMs) {
  if (refreshTimer) clearTimeout(refreshTimer)
  const delay = expMs - Date.now() - 5 * 60 * 1000 // 5 min before expiry
  if (delay <= 0) { silentRefresh(); return }
  refreshTimer = setTimeout(silentRefresh, delay)
}

function silentRefresh() {
  if (!tokenClient) return
  tokenClient.requestAccessToken({ prompt: '' })
}

// ── Init ───────────────────────────────────────────────────────────────────────

export function initGoogleAuth(onReady) {
  _onReady = onReady

  function setup() {
    if (!window.google?.accounts?.oauth2) return

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (res) => {
        const ok = storeToken(res)
        _onReady?.(ok)
      },
      error_callback: () => {
        // Silent refresh failed — clear token, let user reconnect manually
        clearToken()
        _onReady?.(false)
      },
    })

    if (isConnected()) {
      // Token still valid — resume timer and notify
      const exp = Number(localStorage.getItem(EXP_KEY))
      scheduleRefresh(exp)
      onReady?.(true)
    } else if (localStorage.getItem(WAS_KEY)) {
      // Was connected before, token expired — try silent refresh (no popup)
      tokenClient.requestAccessToken({ prompt: '' })
    } else {
      onReady?.(false)
    }
  }

  if (window.google?.accounts?.oauth2) {
    setup()
  } else {
    let attempts = 0
    const poll = setInterval(() => {
      if (window.google?.accounts?.oauth2) { clearInterval(poll); setup() }
      if (++attempts > 40) clearInterval(poll)
    }, 200)
  }
}

// ── Connect / Disconnect ───────────────────────────────────────────────────────

export function connectGoogle() {
  tokenClient?.requestAccessToken({ prompt: isConnected() ? '' : 'consent' })
}

export function disconnectGoogle() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token, () => {})
  }
  clearToken()
  localStorage.removeItem(WAS_KEY)
}

// ── Fetch events ───────────────────────────────────────────────────────────────

export async function fetchMonthEvents(year, month) {
  const token = getToken()
  if (!token) return []

  const timeMin = new Date(year, month - 1, 1).toISOString()
  const timeMax = new Date(year, month, 0, 23, 59, 59).toISOString()
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=100`

  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })

    if (res.status === 401) {
      // Token rejected — try silent refresh, then signal caller to retry
      clearToken()
      if (localStorage.getItem(WAS_KEY) && tokenClient) {
        tokenClient.requestAccessToken({ prompt: '' })
      }
      return null // null = expired, CalendarScreen will react via onReady callback
    }

    if (!res.ok) return []
    const data = await res.json()
    return (data.items || []).map(ev => ({
      id: ev.id,
      title: ev.summary || '(bez naslova)',
      date: (ev.start.dateTime || ev.start.date).split('T')[0],
      time: ev.start.dateTime ? ev.start.dateTime.split('T')[1]?.slice(0, 5) : null,
      endDate: (ev.end.dateTime || ev.end.date).split('T')[0],
      allDay: !ev.start.dateTime,
      color: ev.colorId ? GC_COLORS[ev.colorId] : '#4285F4',
    }))
  } catch {
    return []
  }
}

const GC_COLORS = {
  '1': '#7986CB', '2': '#33B679', '3': '#8E24AA', '4': '#E67C73',
  '5': '#F6BF26', '6': '#F4511E', '7': '#039BE5', '8': '#616161',
  '9': '#3F51B5', '10': '#0B8043', '11': '#D50000',
}
