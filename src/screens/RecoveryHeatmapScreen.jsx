import { useState } from 'react'
import { useApp } from '../App.jsx'
import { loadRecoverySessions, saveRecoverySessions } from '../utils/storage.js'

const SESSION_TYPES = [
  { id: 'rehab',    label: 'Rehab',    color: '#a855f7' },
  { id: 'cardio',   label: 'Cardio',   color: '#f59e0b' },
  { id: 'trening',  label: 'Trening',  color: '#ef4444' },
  { id: 'utakmica', label: 'Utakmica', color: '#22c55e' },
  { id: 'odmor',    label: 'Odmor',    color: '#3b82f6' },
]

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Avg','Sep','Okt','Nov','Dec']
const MONTH_FULL  = ['Januar','Februar','Mart','April','Maj','Juni','Juli','Avgust','Septembar','Oktobar','Novembar','Decembar']
const DAY_NAMES   = ['P','U','S','Č','P','S','N']

function dKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

function buildGrid(y, m) {
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7
  const days = new Date(y, m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  return cells
}

function getStreakFrom(map, today) {
  let streak = 0
  const d = new Date(today)
  while (true) {
    const key = dKey(d.getFullYear(), d.getMonth(), d.getDate())
    const s = map[key]
    if (!s || s.type === 'odmor') break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export default function RecoveryHeatmapScreen() {
  const { t } = useApp()
  const today = new Date()
  const [sessions, setSessions] = useState(loadRecoverySessions)
  const [y, setY] = useState(today.getFullYear())
  const [m, setM] = useState(today.getMonth())
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})

  const sessionMap = Object.fromEntries(sessions.map(s => [s.date, s]))

  function persist(next) { setSessions(next); saveRecoverySessions(next) }

  function prevMonth() { m === 0 ? (setY(y-1), setM(11)) : setM(m-1) }
  function nextMonth() { m === 11 ? (setY(y+1), setM(0)) : setM(m+1) }

  function openDay(day) {
    const key = dKey(y, m, day)
    setSelected(key)
    setForm(sessionMap[key] || { type: 'rehab', duration: '', pain: 0, notes: '' })
  }

  function saveSession() {
    const filtered = sessions.filter(s => s.date !== selected)
    const hasData = form.type || form.duration || form.notes
    const next = hasData ? [...filtered, { date: selected, ...form }] : filtered
    persist(next)
    setSelected(null)
  }

  function delSession() {
    persist(sessions.filter(s => s.date !== selected))
    setSelected(null)
  }

  const cells = buildGrid(y, m)
  const monthKey = `${y}-${String(m+1).padStart(2,'0')}`
  const monthSessions = sessions.filter(s => s.date.startsWith(monthKey))
  const streak = getStreakFrom(sessionMap, today)
  const avgPain = monthSessions.length
    ? (monthSessions.reduce((s, x) => s + (x.pain || 0), 0) / monthSessions.length).toFixed(1)
    : '–'
  const todayKey = dKey(today.getFullYear(), today.getMonth(), today.getDate())

  if (selected) {
    const typeData = SESSION_TYPES.find(t => t.id === form.type) || SESSION_TYPES[0]
    return (
      <div className="screen fade-in">
        <div className="screen-header">
          <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, padding: '0 8px 0 0' }}>← Nazad</button>
          <div className="screen-title">{selected}</div>
        </div>

        <div className="card">
          <div className="card-glow" />
          <div className="field">
            <label className="field-label">{t.session_type_label}</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SESSION_TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => setForm(p => ({ ...p, type: t.id }))} style={{
                  padding: '8px 13px', borderRadius: 9, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: form.type === t.id ? t.color + '20' : 'transparent',
                  border: `0.5px solid ${form.type === t.id ? t.color : 'var(--card-border)'}`,
                  color: form.type === t.id ? t.color : 'var(--text-dim)',
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          <div className="field-row c2">
            <div className="field">
              <label className="field-label">{t.duration_label}</label>
              <input className="field-input" type="number" value={form.duration || ''} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="45" />
            </div>
            <div className="field">
              <label className="field-label">{t.pain_0_10}</label>
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} type="button" onClick={() => setForm(p => ({ ...p, pain: n }))} style={{
                    width: 28, height: 28, borderRadius: 7, fontFamily: 'inherit', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    background: form.pain === n ? (n > 6 ? '#ef4444' : n > 3 ? '#f59e0b' : '#22c55e') + '30' : 'transparent',
                    border: `0.5px solid ${form.pain === n ? (n > 6 ? '#ef4444' : n > 3 ? '#f59e0b' : '#22c55e') : 'var(--card-border)'}`,
                    color: form.pain === n ? 'var(--text)' : 'var(--text-dimmer)',
                  }}>{n}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <label className="field-label">{t.session_notes_label}</label>
            <textarea className="field-textarea" value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder={t.session_notes_placeholder} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 8 }} onClick={saveSession}>
            {t.save_session_btn}
          </button>
          {sessionMap[selected] && (
            <button className="btn btn-outline" style={{ width: '100%', color: '#ef4444', borderColor: '#ef4444' }} onClick={delSession}>
              {t.delete_record}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">RECOVERY</div>
          <div className="screen-title">{t.recovery_title}</div>
          <div className="screen-sub">{t.recovery_sub}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: t.streak_label, value: streak ? `${streak}d` : '–', color: '#22c55e' },
          { label: t.this_month_label, value: monthSessions.filter(s=>s.type!=='odmor').length, color: 'var(--accent)' },
          { label: t.avg_pain_label, value: avgPain, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 9, color: 'var(--text-dimmer)', letterSpacing: '0.8px', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={prevMonth} style={{ background: 'var(--card)', border: '0.5px solid var(--card-border)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-dim)', fontFamily: 'inherit' }}>‹</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{MONTH_FULL[m]} {y}</div>
        <button type="button" onClick={nextMonth} style={{ background: 'var(--card)', border: '0.5px solid var(--card-border)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-dim)', fontFamily: 'inherit' }}>›</button>
      </div>

      {/* Calendar */}
      <div className="card" style={{ padding: '14px 12px', marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 8 }}>
          {DAY_NAMES.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-dimmer)', fontWeight: 600 }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const key = dKey(y, m, day)
            const s = sessionMap[key]
            const t = s ? SESSION_TYPES.find(x => x.id === s.type) : null
            const isToday = key === todayKey
            const isFuture = new Date(key) > today
            return (
              <button key={i} type="button" onClick={() => !isFuture && openDay(day)} style={{
                aspectRatio: '1', borderRadius: 8,
                border: isToday ? `1.5px solid var(--accent)` : '0.5px solid var(--card-border)',
                background: t ? t.color + '40' : 'transparent',
                cursor: isFuture ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: isToday ? 800 : 500,
                color: t ? 'white' : isToday ? 'var(--accent)' : isFuture ? 'var(--text-dimmer)' : 'var(--text-dim)',
                opacity: isFuture ? 0.3 : 1,
                transition: 'all 0.1s',
              }}>
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {SESSION_TYPES.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: t.color + '60', border: `0.5px solid ${t.color}` }} />
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Recent sessions */}
      {monthSessions.length > 0 && (
        <>
          <div className="section-title">{t.this_month_sessions}</div>
          {[...monthSessions].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5).map(s => {
            const t = SESSION_TYPES.find(x => x.id === s.type) || SESSION_TYPES[0]
            return (
              <div key={s.date} className="card" style={{ marginBottom: 7, display: 'flex', alignItems: 'center', gap: 10, borderLeft: `2px solid ${t.color}`, cursor: 'pointer' }}
                onClick={() => { const d = new Date(s.date); setY(d.getFullYear()); setM(d.getMonth()); openDay(d.getDate()) }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.color }}>{t.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>{s.date}</span>
                    {s.duration && <span style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>{s.duration}min</span>}
                  </div>
                  {s.notes && <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{s.notes}</div>}
                </div>
                {s.pain !== undefined && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.pain > 6 ? '#ef4444' : s.pain > 3 ? '#f59e0b' : '#22c55e', flexShrink: 0 }}>
                    {t.pain_display} {s.pain}/10
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      <button className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} onClick={() => openDay(today.getDate())}>
        + Logiraj danas
      </button>
    </div>
  )
}
