import { useState, useEffect } from 'react'
import { useApp } from '../App.jsx'
import { MONTHS } from '../data/months.js'
import { loadDayData } from '../utils/storage.js'
import {
  initGoogleAuth, connectGoogle, disconnectGoogle,
  fetchMonthEvents, isConnected,
} from '../utils/googleCalendar.js'
import { CaretLeft, CaretRight, CalendarBlank, LinkBreak, ArrowsClockwise } from '@phosphor-icons/react'

function daysInMonth(year, month) { return new Date(year, month, 0).getDate() }
function firstDayOfMonth(year, month) {
  const d = new Date(year, month - 1, 1).getDay()
  return d === 0 ? 6 : d - 1
}

export default function CalendarScreen() {
  const { settings, t, selectedDate, setSelectedDate } = useApp()
  const today = new Date()
  const [view, setView] = useState({ year: selectedDate.getFullYear(), month: selectedDate.getMonth() + 1 })
  const [selected, setSelected] = useState(null)
  const [gcConnected, setGcConnected] = useState(isConnected)
  const [gcEvents, setGcEvents] = useState([])
  const [gcLoading, setGcLoading] = useState(false)
  const [gcExpired, setGcExpired] = useState(false)

  const month = MONTHS[view.month - 1]
  const totalDays = daysInMonth(view.year, view.month)
  const offset = firstDayOfMonth(view.year, view.month)

  // Init Google auth on mount — callback fires on connect AND on silent token refresh
  useEffect(() => {
    initGoogleAuth((ok) => {
      setGcConnected(ok)
      setGcExpired(!ok)
      if (ok) loadGcEvents(view.year, view.month)
    })
  }, [])

  // Reload events when month changes
  useEffect(() => {
    if (gcConnected) loadGcEvents(view.year, view.month)
  }, [view, gcConnected])

  async function loadGcEvents(year, month) {
    setGcLoading(true)
    const events = await fetchMonthEvents(year, month)
    if (events === null) {
      // Token expired
      setGcConnected(false)
      setGcExpired(true)
      setGcEvents([])
    } else {
      setGcEvents(events)
      setGcExpired(false)
    }
    setGcLoading(false)
  }

  function handleConnect() {
    connectGoogle()
    // After token callback, initGoogleAuth already handles state
    const check = setInterval(() => {
      if (isConnected()) {
        clearInterval(check)
        setGcConnected(true)
        setGcExpired(false)
        loadGcEvents(view.year, view.month)
      }
    }, 500)
    setTimeout(() => clearInterval(check), 30000)
  }

  function handleDisconnect() {
    disconnectGoogle()
    setGcConnected(false)
    setGcEvents([])
  }

  function navMonth(dir) {
    setView(v => {
      let m = v.month + dir, y = v.year
      if (m > 12) { m = 1; y++ }
      if (m < 1) { m = 12; y-- }
      return { year: y, month: m }
    })
    setSelected(null)
  }

  function selectDay(day) {
    const d = new Date(view.year, view.month - 1, day)
    setSelected(day)
    setSelectedDate(d)
  }

  function getDayStatus(day) {
    const d = new Date(view.year, view.month - 1, day)
    const data = loadDayData(d)
    const tasksDone = [data.task1Done, data.task2Done, data.task3Done].filter(Boolean).length
    const isToday = today.getFullYear() === view.year && today.getMonth() + 1 === view.month && today.getDate() === day
    return { data, tasksDone, isToday }
  }

  function getDateStr(day) {
    const m = String(view.month).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${view.year}-${m}-${d}`
  }

  function getDayEvents(day) {
    const dateStr = getDateStr(day)
    return gcEvents.filter(ev => ev.date <= dateStr && ev.endDate >= dateStr)
  }

  const selectedData = selected ? loadDayData(new Date(view.year, view.month - 1, selected)) : null
  const selectedEvents = selected ? getDayEvents(selected) : []

  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)

  const dayLabels = t.day_labels || ['Po', 'Ut', 'Sr', 'Če', 'Pe', 'Su', 'Ne']

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">KALENDER</div>
          <div className="screen-title">{t.calendar}</div>
          <div className="screen-sub">{MONTHS[view.month-1].name[settings.lang] || MONTHS[view.month-1].name.bs} {view.year}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {gcConnected ? (
            <button
              onClick={handleDisconnect}
              title="Odspoji Google Calendar"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 8,
                background: 'rgba(66,133,244,0.12)',
                border: '0.5px solid rgba(66,133,244,0.3)',
                color: '#4285F4', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {gcLoading
                ? <ArrowsClockwise weight="fill" size={12} style={{ animation: 'spin 1s linear infinite' }} />
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              }
              Google
              <LinkBreak size={11} />
            </button>
          ) : (
            <button
              onClick={handleConnect}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 8,
                background: 'rgba(66,133,244,0.1)',
                border: '0.5px solid rgba(66,133,244,0.25)',
                color: 'rgba(66,133,244,0.8)', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" opacity="0.8"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Spoji Calendar
            </button>
          )}
          <div className="month-card-icon" style={{ width: 36, height: 36 }}>
            <div dangerouslySetInnerHTML={{ __html: month.icon }} style={{ width: 20, height: 20 }} />
          </div>
        </div>
      </div>

      {/* Token expired warning */}
      {gcExpired && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', marginBottom: 8,
          background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)',
          borderRadius: 10, fontSize: 12, color: 'var(--red)',
        }}>
          Google sesija istekla
          <button onClick={handleConnect} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>Ponovo spoji</button>
        </div>
      )}

      {/* Month nav */}
      <div className="cal-header">
        <button className="cal-nav" onClick={() => navMonth(-1)}>
          <CaretLeft size={18} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div className="cal-month">{month.name[settings.lang] || month.name.bs}</div>
          <div className="cal-year">{view.year}</div>
        </div>
        <button className="cal-nav" onClick={() => navMonth(1)}>
          <CaretRight size={18} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="card" style={{ padding: '12px 8px' }}>
        <div className="cal-grid">
          {dayLabels.map(d => <div key={d} className="cal-day-label">{d}</div>)}
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} className="cal-day empty" />
            const { tasksDone, isToday } = getDayStatus(day)
            const isSelected = selected === day
            const dayEvs = getDayEvents(day)
            return (
              <div
                key={day}
                className={`cal-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${tasksDone > 0 ? ' has-data' : ''}`}
                onClick={() => selectDay(day)}
                style={{ position: 'relative' }}
              >
                <span className="cal-day-num">{day}</span>
                {tasksDone > 0 && !isSelected && (
                  <span style={{ fontSize: 8, color: isToday ? 'var(--accent)' : 'var(--green)', fontWeight: 600 }}>{tasksDone}/3</span>
                )}
                {dayEvs.length > 0 && (
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', marginTop: 1 }}>
                    {dayEvs.slice(0, 3).map((ev, idx) => (
                      <div key={idx} style={{ width: 4, height: 4, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="card slide-up" style={{ marginTop: 12 }}>
          <div className="card-header">
            <div className="card-icon">
              <CalendarBlank weight="fill" size={18} />
            </div>
            <div>
              <div className="card-title">{selected}. {month.name[settings.lang] || month.name.bs} {view.year}</div>
              <div className="card-sub">
                {[selectedData?.task1Done, selectedData?.task2Done, selectedData?.task3Done].filter(Boolean).length} / 3 {t.tasks_completed}
                {selectedEvents.length > 0 && ` · ${selectedEvents.length} Google event${selectedEvents.length > 1 ? 'a' : ''}`}
              </div>
            </div>
          </div>

          {/* Google Calendar events */}
          {selectedEvents.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {selectedEvents.map(ev => (
                <div key={ev.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', marginBottom: 5,
                  background: `${ev.color}14`,
                  border: `0.5px solid ${ev.color}44`,
                  borderLeft: `3px solid ${ev.color}`,
                  borderRadius: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                    {ev.time && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>{ev.time}</div>}
                    {ev.allDay && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>Cijeli dan</div>}
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}

          {selectedData && (
            <>
              {(selectedData.feeling || selectedData.energy || selectedData.sleep) && (
                <div className="field-row c3" style={{ marginBottom: 10 }}>
                  {[[t.feeling_cap, selectedData.feeling], [t.energy_cap, selectedData.energy], [t.sleep_cap, selectedData.sleep ? selectedData.sleep + 'h' : '']].map(([l, v]) => (
                    v ? <div key={l} style={{ textAlign: 'center', background: 'var(--accent-dim)', borderRadius: 8, padding: '8px 4px' }}>
                      <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{v}</div>
                    </div> : null
                  ))}
                </div>
              )}

              {[1,2,3].map(i => {
                const task = selectedData[`task${i}`]
                const done = selectedData[`task${i}Done`]
                if (!task) return null
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--card-border)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: done ? 'var(--accent)' : 'transparent', border: done ? 'none' : '1.5px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {done && <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: done ? 'var(--text-dim)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>{task}</span>
                  </div>
                )
              })}

              {selectedData.wins && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--green-dim)', borderRadius: 8, borderLeft: '2px solid var(--green)' }}>
                  <div style={{ fontSize: 9, color: 'var(--green)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{t.wins}</div>
                  <div style={{ fontSize: 12, color: 'var(--text)' }}>{selectedData.wins}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Monthly stats */}
      <div className="section-title">{t.stats_month} — {month.short[settings.lang] || month.short.bs}</div>
      <div className="stat-bar">
        {(() => {
          let tracked = 0, tasksTotal = 0
          for (let d = 1; d <= totalDays; d++) {
            const { tasksDone } = getDayStatus(d)
            if (tasksDone > 0) tracked++
            tasksTotal += tasksDone
          }
          return (
            <>
              <div className="stat-card">
                <div className="stat-label">{t.days_tracked}</div>
                <div className="stat-value">{tracked}</div>
                <div className="stat-sub">{t.of} {totalDays}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">{t.tasks}</div>
                <div className="stat-value">{tasksTotal}</div>
                <div className="stat-sub">{t.completed}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">GC Events</div>
                <div className="stat-value" style={{ color: '#4285F4' }}>{gcEvents.length}</div>
                <div className="stat-sub">{gcConnected ? 'sinhronizovano' : 'nije spojeno'}</div>
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}
