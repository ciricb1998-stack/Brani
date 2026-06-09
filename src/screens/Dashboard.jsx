import { useState, useEffect } from 'react'
import { useApp } from '../App.jsx'
import { BRANDS } from '../data/brands.js'
import { MONTHS } from '../data/months.js'
import { loadDayData, saveDayData } from '../utils/storage.js'
import { House, Lightning, Target, ArrowsClockwise, Brain, ChartBar } from '@phosphor-icons/react'

// ─── helpers ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'GUTE NACHT'
  if (h < 12) return 'GUTEN MORGEN'
  if (h < 18) return 'GUTEN TAG'
  return 'GUTEN ABEND'
}

const WEEKDAYS_DE = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.']
const MONTHS_DE   = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function fmtDate(d) {
  return `${WEEKDAYS_DE[d.getDay()]} ${String(d.getDate()).padStart(2,'0')}. ${MONTHS_DE[d.getMonth()]} ${d.getFullYear()}`
}

function calcStreak() {
  let s = 0
  const today = new Date()
  for (let i = 0; i < 90; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const data = loadDayData(d)
    if (data.task1Done || data.task2Done || data.task3Done) s++
    else if (i > 0) break
  }
  return s
}

function getWeekScores() {
  const scores = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const data = loadDayData(d)
    const done = [data.task1Done, data.task2Done, data.task3Done].filter(Boolean).length
    scores.push(done)
  }
  return scores
}

function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) { setCount(0); return }
    const start = Date.now()
    let raf
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(target * e))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return count
}

// ─── sub-components ───────────────────────────────────────────────────────────

function RingTracker({ value, max, label, accent, size = 68 }) {
  const r = (size / 2) - 6
  const c = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const offset = c * (1 - pct)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: 1 }}>
      <div style={{
        width: size + 16, height: size + 16,
        background: '#0f0f0f',
        border: '1px solid #1e1e1e',
        borderRadius: 18,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 4,
      }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke="#1e1e1e" strokeWidth="4"
            />
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={accent} strokeWidth="4"
              strokeDasharray={c} strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size/2} ${size/2})`}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.34,1,0.64,1)' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#f0f0f0', letterSpacing: '-0.5px' }}>
              {value}
            </span>
          </div>
        </div>
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700,
        color: '#444', letterSpacing: '1.8px',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  )
}

function TaskRow({ index, task, done, onToggle, accent }) {
  return (
    <div
      onClick={() => task && onToggle(index)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 0',
        borderBottom: index < 3 ? '1px solid #111' : 'none',
        cursor: task ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
        borderLeft: done ? `3px solid ${accent}` : '3px solid transparent',
        paddingLeft: 12,
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        border: done ? 'none' : '1.5px solid #444',
        background: done ? accent : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {done && (
          <svg viewBox="0 0 12 9" fill="none" stroke="#000" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 7 }}>
            <polyline points="1 4.5 4.5 8 11 1" />
          </svg>
        )}
      </div>
      <span style={{
        fontSize: 14, fontWeight: done ? 500 : 600,
        color: task ? (done ? '#666' : '#e8e8e8') : '#444',
        textDecoration: done ? 'line-through' : 'none',
        transition: 'all 0.2s',
        letterSpacing: '-0.1px',
      }}>
        {task || `Aufgabe ${index} — nicht eingetragen`}
      </span>
    </div>
  )
}

function WeekBars({ scores, accent }) {
  const max = Math.max(...scores, 1)
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const today = new Date().getDay()
  // getDay: 0=Sun...6=Sat, our array is Mon...Sun so index shifts
  const todayIdx = today === 0 ? 6 : today - 1

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 56, paddingTop: 4 }}>
      {scores.map((v, i) => {
        const pct = max > 0 ? v / max : 0
        const isToday = i === todayIdx
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%', borderRadius: 4,
              height: Math.max(pct * 40, 4),
              background: isToday ? accent : v > 0 ? `${accent}55` : '#1e1e1e',
              transition: 'height 0.6s ease',
            }} />
            <span style={{ fontSize: 8, color: isToday ? accent : '#333', fontWeight: isToday ? 700 : 500 }}>
              {days[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { settings, t, setScreen } = useApp()
  const b = BRANDS[settings.brand] || BRANDS.brani
  const accent = b.primary || '#F97316'
  const today = new Date()
  const [todayData, setTodayData] = useState(() => loadDayData(today))
  const streak = calcStreak()
  const tasksDone = [todayData.task1Done, todayData.task2Done, todayData.task3Done].filter(Boolean).length
  const weekScores = getWeekScores()
  const streakCount = useCountUp(streak)
  const tasksCount = useCountUp(tasksDone)
  const weekNum = Math.ceil(streak / 7) || 1
  const weekCount = useCountUp(weekNum)

  function toggleTask(i) {
    const key = `task${i}Done`
    const updated = { ...todayData, [key]: !todayData[key] }
    setTodayData(updated)
    saveDayData(today, updated)
  }

  const monthProgress = Math.round((today.getDate() / new Date(today.getFullYear(), today.getMonth()+1, 0).getDate()) * 100)
  const monthName = MONTHS[today.getMonth()]?.name?.[settings.lang] || MONTHS[today.getMonth()]?.name?.bs || ''

  return (
    <div className="screen fade-in" style={{ paddingBottom: 100, background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div style={{ padding: '8px 0 20px' }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'var(--text-dimmer, #888)',
          letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 6,
        }}>
          {getGreeting()}
        </div>
        <div style={{
          fontSize: 34, fontWeight: 800, color: 'var(--text, #f0f0f0)',
          letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 6,
        }}>
          {settings.name || 'Branislav'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dimmer, #888)', fontWeight: 500 }}>
          {fmtDate(today)}
        </div>
      </div>

      {/* ── Ring Trackers ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <RingTracker value={streakCount} max={Math.max(streak, 30)} label="STREAK" accent={accent} />
        <RingTracker value={tasksCount} max={3} label="HEUTE" accent={accent} />
        <RingTracker value={weekCount}  max={Math.max(weekNum, 12)} label="WOCHEN" accent={accent} />
      </div>

      {/* ── Prioritäten ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text-dimmer, #888)',
            letterSpacing: '2.5px', textTransform: 'uppercase',
          }}>
            PRIORITÄTEN HEUTE
          </span>
          <div style={{
            fontSize: 10, fontWeight: 700, color: accent,
            background: `${accent}14`, border: `1px solid ${accent}30`,
            borderRadius: 6, padding: '3px 9px', letterSpacing: '0.5px',
          }}>
            {tasksDone} / 3
          </div>
        </div>
        <div style={{
          background: '#0f0f0f',
          border: '1px solid #161616',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          {[1, 2, 3].map(i => (
            <TaskRow
              key={i} index={i}
              task={todayData[`task${i}`]}
              done={todayData[`task${i}Done`]}
              onToggle={toggleTask}
              accent={accent}
            />
          ))}
          <div style={{ padding: '12px 16px' }}>
            <button
              onClick={() => setScreen('planner')}
              style={{
                width: '100%', padding: '10px', borderRadius: 8,
                background: `${accent}14`, border: `1px solid ${accent}25`,
                color: accent, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                letterSpacing: '1px', textTransform: 'uppercase',
              }}
            >
              Planer öffnen
            </button>
          </div>
        </div>
      </div>

      {/* ── Weekly Score + Monat Progress ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {/* Wöchentlicher Score */}
        <div style={{
          background: '#0f0f0f', border: '1px solid #161616',
          borderRadius: 14, padding: '14px',
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: 'var(--text-dimmer, #888)',
            letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10,
          }}>
            WOCHE
          </div>
          <WeekBars scores={weekScores} accent={accent} />
        </div>

        {/* Monat Progress */}
        <div style={{
          background: '#0f0f0f', border: '1px solid #161616',
          borderRadius: 14, padding: '14px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: 'var(--text-dimmer, #888)',
            letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10,
          }}>
            {monthName.toUpperCase() || 'MONAT'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <div style={{ position: 'relative', width: 60, height: 60 }}>
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="24" fill="none" stroke="#1e1e1e" strokeWidth="4"/>
                <circle cx="30" cy="30" r="24" fill="none" stroke={accent} strokeWidth="4"
                  strokeDasharray={`${2*Math.PI*24}`}
                  strokeDashoffset={`${2*Math.PI*24*(1-monthProgress/100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 30 30)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f0f0' }}>{monthProgress}%</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#2a2a2a', textAlign: 'center', marginTop: 8 }}>
            {today.getDate()} von {new Date(today.getFullYear(), today.getMonth()+1, 0).getDate()} Tagen
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{
        fontSize: 10, fontWeight: 700, color: 'var(--text-dimmer, #888)',
        letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 12,
      }}>
        SCHNELLZUGRIFF
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
        {[
          { screen: 'ai',           Icon: Brain,           label: 'AI Coach'   },
          { screen: 'capture',      Icon: Lightning,       label: 'Capture'    },
          { screen: 'stats',        Icon: ChartBar,        label: 'Statistiken'},
          { screen: 'goals',        Icon: Target,          label: 'Ziele'      },
          { screen: 'recovery',     Icon: House,           label: 'Recovery'   },
          { screen: 'weekly_review',Icon: ArrowsClockwise, label: 'Review'     },
        ].map(({ screen: sc, Icon, label }) => (
          <button
            key={sc}
            onClick={() => setScreen(sc)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '14px 8px',
              background: '#0f0f0f',
              border: '1px solid #161616',
              borderRadius: 12, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'border-color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
            onTouchStart={e => e.currentTarget.style.borderColor = `${accent}50`}
            onTouchEnd={e => e.currentTarget.style.borderColor = '#161616'}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `${accent}12`,
              border: `1px solid ${accent}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} color={accent} weight="fill" />
            </div>
            <span style={{
              fontSize: 9, fontWeight: 600,
              color: '#444', letterSpacing: '0.3px',
              textAlign: 'center', lineHeight: 1.3,
            }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Brand tagline ── */}
      <div style={{
        textAlign: 'center',
        fontSize: 9, color: '#1e1e1e',
        letterSpacing: '3px', textTransform: 'uppercase',
        paddingBottom: 8,
      }}>
        {b.tagline}
      </div>
    </div>
  )
}
