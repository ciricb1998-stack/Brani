import React, { useState, useEffect, createContext, useContext } from 'react'
import { loadSettings, saveSettings } from './utils/storage.js'
import { checkScheduledNotifications, scheduleDaily } from './utils/notifications.js'
import { shouldFireAlarm, fireAlarm, stopAlarm, snoozeAlarm, loadAlarm } from './utils/alarm.js'
import { BRANDS } from './data/brands.js'
import { getT } from './data/i18n.js'
import { supabase } from './utils/supabase.js'
import { setSyncUser, clearSyncUser, syncLoadAll, subscribeSync } from './utils/sync.js'

import PinScreen from './screens/PinScreen.jsx'
import OnboardingScreen from './screens/OnboardingScreen.jsx'
import AuthScreen from './screens/AuthScreen.jsx'
import Dashboard from './screens/Dashboard.jsx'
import CalendarScreen from './screens/CalendarScreen.jsx'
import PlannerScreen from './screens/PlannerScreen.jsx'
import StatsScreen from './screens/StatsScreen.jsx'
import GoalsScreen from './screens/GoalsScreen.jsx'
import AIAgentScreen from './screens/AIAgentScreen.jsx'
import ExportScreen from './screens/ExportScreen.jsx'
import SettingsScreen from './screens/SettingsScreen.jsx'
import LogDashboardScreen from './screens/LogDashboardScreen.jsx'
import LogChannelsScreen from './screens/LogChannelsScreen.jsx'
import LogCalendarScreen from './screens/LogCalendarScreen.jsx'
import LogStatsScreen from './screens/LogStatsScreen.jsx'
import BDLDashboardScreen from './screens/BDLDashboardScreen.jsx'
import BDLClientsScreen from './screens/BDLClientsScreen.jsx'
import BDLMeetingsScreen from './screens/BDLMeetingsScreen.jsx'
import BDLProjectsScreen from './screens/BDLProjectsScreen.jsx'
import BDLEmailScreen from './screens/BDLEmailScreen.jsx'
import BDLEmailComposerScreen from './screens/BDLEmailComposerScreen.jsx'
import PipelineScreen from './screens/PipelineScreen.jsx'
import FinanceScreen from './screens/FinanceScreen.jsx'
import QuickCaptureScreen from './screens/QuickCaptureScreen.jsx'
import RecoveryHeatmapScreen from './screens/RecoveryHeatmapScreen.jsx'
import WeeklyReviewScreen from './screens/WeeklyReviewScreen.jsx'
import VocabScreen from './screens/VocabScreen.jsx'
import FootballScreen from './screens/FootballScreen.jsx'
import TrainingPlanScreen from './screens/TrainingPlanScreen.jsx'
import BDLInvoiceScreen from './screens/BDLInvoiceScreen.jsx'
import BDLDocumentsScreen from './screens/BDLDocumentsScreen.jsx'
import BottomNav from './components/BottomNav.jsx'
import SidebarNav from './components/SidebarNav.jsx'
import FloatingCapture from './components/FloatingCapture.jsx'
import AlarmScreen from './screens/AlarmScreen.jsx'
import DTGmbHScreen, { MentorView } from './screens/DTGmbHScreen.jsx'
import HilfeScreen from './screens/HilfeScreen.jsx'

const PREFIX = 'brani_'
const mentorParam = (window.location.hash.match(/^#mentor=(.+)$/) || window.location.hash.match(/[#&]mentor=([^&]+)/))?.[1] || new URLSearchParams(window.location.search).get('mentor')

function useIsDesktop() {
  const [is, setIs] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const h = e => setIs(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return is
}

export const AppCtx = createContext({})
export const useApp = () => useContext(AppCtx)

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100dvh', background: '#080808',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 24,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{
        width: 52, height: 52,
        border: '2px solid #1e1e1e',
        borderTop: '2px solid #F97316',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <div style={{ fontSize: 11, color: '#444444', letterSpacing: '4px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>LADEN</div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [unlocked, setUnlocked] = useState(() => localStorage.getItem('brani_unlocked') === '1')
  const [onboarded, setOnboarded] = useState(() => {
    try { return !!JSON.parse(localStorage.getItem('brani_onboarded')) } catch { return false }
  })
  const [screen, setScreen] = useState('home')
  const [settings, setSettings] = useState(loadSettings())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [updateReady, setUpdateReady] = useState(false)
  const [pendingVer, setPendingVer] = useState(null)
  const [alarmFiring, setAlarmFiring] = useState(false)

  // Auth — check session on mount
  useEffect(() => {
    const timeout = setTimeout(() => setAuthLoading(false), 5000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      if (session?.user) {
        handleUserLogin(session.user)
      } else {
        setAuthLoading(false)
      }
    }).catch(() => {
      clearTimeout(timeout)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearSyncUser()
        setUser(null)
      }
    })
    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  async function handleUserLogin(u) {
    setSyncUser(u.id)
    try {
      const remote = await Promise.race([
        syncLoadAll(),
        new Promise(res => setTimeout(() => res({}), 5000))
      ])
      Object.entries(remote).forEach(([key, value]) => {
        localStorage.setItem(PREFIX + key, JSON.stringify(value))
      })
    } catch {}
    setUser(u)
    setSettings(loadSettings())
    window.dispatchEvent(new CustomEvent('brani-sync', { detail: { key: 'all' } }))
    setAuthLoading(false)
  }

  // Real-time sync — upiši u localStorage + obavijesti komponente
  useEffect(() => {
    if (!user) return
    const channel = subscribeSync((key, value) => {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
      window.dispatchEvent(new CustomEvent('brani-sync', { detail: { key } }))
    })
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [user])

  // Re-sync na focus — max jednom svakih 30s
  useEffect(() => {
    if (!user) return
    let lastSync = 0
    const handleFocus = async () => {
      const now = Date.now()
      if (now - lastSync < 30000) return
      lastSync = now
      try {
        const remote = await syncLoadAll()
        Object.entries(remote).forEach(([key, value]) => {
          localStorage.setItem(PREFIX + key, JSON.stringify(value))
        })
        window.dispatchEvent(new CustomEvent('brani-sync', { detail: { key: 'all' } }))
      } catch {}
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  // Brand CSS variables
  useEffect(() => {
    const b = BRANDS[settings.brand] || BRANDS.brani
    const root = document.documentElement
    root.style.setProperty('--accent', b.primary)
    root.style.setProperty('--accent-dim', b.primaryDim)
    root.style.setProperty('--accent-glow', b.primaryGlow)
    root.style.setProperty('--accent-icon-bg', b.iconBg)
  }, [settings.brand, settings.theme])

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark')
  }, [settings.theme])

  // Notification + alarm scheduler
  useEffect(() => {
    function tick() {
      checkScheduledNotifications()
      if (shouldFireAlarm()) {
        const alarm = loadAlarm()
        setAlarmFiring(true)
        fireAlarm(alarm)
      }
    }
    tick()
    const interval = setInterval(tick, 60000)
    const cleanup = scheduleDaily()
    return () => { clearInterval(interval); cleanup?.() }
  }, [])

  // PWA version check
  useEffect(() => {
    const VER_KEY = 'brani_ver'
    const check = async () => {
      try {
        const res = await fetch('/version.json?_=' + Date.now(), { cache: 'no-store' })
        if (!res.ok) return
        const { v } = await res.json()
        const stored = localStorage.getItem(VER_KEY)
        if (!stored) { localStorage.setItem(VER_KEY, v); return }
        if (stored !== v) { setPendingVer(v); setUpdateReady(true) }
      } catch {}
    }
    check()
    const t = setInterval(check, 4 * 60 * 1000)
    return () => clearInterval(t)
  }, [])

  async function applyUpdate() {
    if (pendingVer) localStorage.setItem('brani_ver', pendingVer)
    try {
      // Unregister all SWs and clear all caches — guaranteed fresh load
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map(r => r.unregister()))
      }
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map(k => caches.delete(k)))
      }
    } catch {}
    window.location.reload()
  }

  function updateSettings(patch) {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
  }

  const t = getT(settings.lang)
  const ctx = { settings, updateSettings, selectedDate, setSelectedDate, setScreen, t, user }

  const screens = {
    home: Dashboard,
    calendar: CalendarScreen,
    planner: PlannerScreen,
    stats: StatsScreen,
    goals: GoalsScreen,
    ai: AIAgentScreen,
    export: ExportScreen,
    settings: SettingsScreen,
    log_home: LogDashboardScreen,
    log_channels: LogChannelsScreen,
    log_calendar: LogCalendarScreen,
    log_stats: LogStatsScreen,
    bdl_home: BDLDashboardScreen,
    bdl_clients: BDLClientsScreen,
    bdl_meetings: BDLMeetingsScreen,
    bdl_projects: BDLProjectsScreen,
    bdl_email: BDLEmailScreen,
    bdl_composer: BDLEmailComposerScreen,
    bdl_invoice: BDLInvoiceScreen,
    bdl_documents: BDLDocumentsScreen,
    bdl_pipeline: PipelineScreen,
    bdl_finance: FinanceScreen,
    capture: QuickCaptureScreen,
    recovery: RecoveryHeatmapScreen,
    weekly_review: WeeklyReviewScreen,
    vocab: VocabScreen,
    football: FootballScreen,
    training_plan: TrainingPlanScreen,
    alarm: AlarmScreen,
    dt_gmbh: DTGmbHScreen,
    hilfe: HilfeScreen,
  }
  const brandHome = { brani: 'home', log: 'log_home', branip: 'bdl_home' }
  const ActiveScreen = screens[screen] || screens[brandHome[settings.brand]] || Dashboard
  const isDesktop = useIsDesktop()

  if (mentorParam) return <MentorView token={mentorParam} />
  if (authLoading) return <LoadingScreen />
  if (!user) return <AuthScreen onAuth={handleUserLogin} />

  if (!unlocked) return (
    <AppCtx.Provider value={ctx}>
      <PinScreen onUnlock={() => setUnlocked(true)} />
    </AppCtx.Provider>
  )
  if (!onboarded) return (
    <AppCtx.Provider value={ctx}>
      <OnboardingScreen onComplete={() => setOnboarded(true)} />
    </AppCtx.Provider>
  )

  return (
    <AppCtx.Provider value={ctx}>
      {updateReady && (
        <div style={{
          position: 'fixed', top: 'calc(var(--safe-top) + 10px)', left: 12, right: 12,
          zIndex: 9999,
          background: 'var(--card, #111111)',
          border: '1px solid var(--card-border, #1e1e1e)',
          borderTop: '2px solid #F97316',
          borderRadius: 12,
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'slideUp 0.25s ease both',
          fontFamily: 'inherit',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, flexShrink: 0 }}>
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text, #f0f0f0)' }}>Update verfügbar</div>
            <div style={{ fontSize: 10, color: 'var(--text-dimmer, #444)' }}>Neue Version bereit</div>
          </div>
          <button
            onClick={applyUpdate}
            style={{
              padding: '6px 12px', borderRadius: 8,
              background: '#F97316', border: 'none',
              color: '#000', fontFamily: 'inherit',
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              letterSpacing: '0.5px', flexShrink: 0,
            }}
          >UPDATE</button>
          <button
            onClick={() => setUpdateReady(false)}
            style={{
              padding: '4px 6px', borderRadius: 6,
              background: 'transparent', border: 'none',
              color: 'var(--text-dimmer, #444)', fontFamily: 'inherit',
              fontSize: 16, cursor: 'pointer', lineHeight: 1,
              flexShrink: 0,
            }}
          >×</button>
        </div>
      )}
      <div className="app-shell">
        {isDesktop && <SidebarNav active={screen} onChange={setScreen} />}
        <div className={isDesktop ? 'desktop-content' : 'mobile-content'}>
          <ActiveScreen />
        </div>
        {!isDesktop && <BottomNav active={screen} onChange={setScreen} />}
        <FloatingCapture isDesktop={isDesktop} />
      </div>

      {/* ── ALARM OVERLAY ── */}
      {alarmFiring && <AlarmOverlay
        accent={(BRANDS[settings.brand] || BRANDS.brani).primary}
        onDismiss={() => { stopAlarm(); setAlarmFiring(false) }}
        onSnooze={() => { snoozeAlarm(); setAlarmFiring(false) }}
      />}
    </AppCtx.Provider>
  )
}

function AlarmOverlay({ accent, onDismiss, onSnooze }) {
  const [now, setNow] = React.useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#030303',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 0, padding: 32,
    }}>
      <style>{`
        @keyframes alarmPulse {
          0%,100% { opacity:.3; transform:scale(1); }
          50% { opacity:.7; transform:scale(1.08); }
        }
        @keyframes alarmRing {
          0%,100% { transform:rotate(-8deg); }
          50% { transform:rotate(8deg); }
        }
      `}</style>

      {/* Glow behind */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%',
        width: 300, height: 300, marginTop: -150, marginLeft: -150,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)`,
        animation: 'alarmPulse 1.2s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Bell icon */}
      <div style={{ fontSize: 52, marginBottom: 24, animation: 'alarmRing 0.5s ease-in-out infinite' }}>🔔</div>

      {/* Time */}
      <div style={{ fontSize: 72, fontWeight: 900, color: accent, letterSpacing: '-3px', lineHeight: 1, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>

      <div style={{ fontSize: 13, color: '#444', letterSpacing: '3px', fontWeight: 700, textTransform: 'uppercase', marginBottom: 48 }}>
        Wecker
      </div>

      {/* Dismiss */}
      <button onClick={onDismiss} style={{
        width: '100%', maxWidth: 320, padding: '18px', borderRadius: 16,
        background: accent, border: 'none', color: '#000',
        fontSize: 16, fontWeight: 900, cursor: 'pointer',
        fontFamily: 'inherit', letterSpacing: '0.5px',
        marginBottom: 12,
      }}>
        Stopp
      </button>

      {/* Snooze */}
      <button onClick={onSnooze} style={{
        width: '100%', maxWidth: 320, padding: '14px', borderRadius: 16,
        background: 'transparent', border: '1px solid #1e1e1e',
        color: '#444', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        fontFamily: 'inherit',
      }}>
        Snooze — 10 Minuten
      </button>
    </div>
  )
}
