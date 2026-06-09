import { useState, useEffect } from 'react'
import { useApp } from '../App.jsx'
import { loadDayData, saveDayData, loadWeekData, saveWeekData, loadHabits, saveHabits, loadHabitLog, saveHabitLog, loadRoutineConfig, saveRoutineConfig } from '../utils/storage.js'
import { Icon, IconBlock, ICON_DEFS, PICKER_ICONS } from '../data/icons.jsx'
import { CheckSquare, Plus, CaretLeft, CaretRight, Heart, Sun, Check, PencilSimple, ClipboardText, Star, ChartBar, FloppyDisk } from '@phosphor-icons/react'

function fmt(d, lang) {
  const locale = lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-US' : 'bs-BA'
  return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
}

function HabitsTab({ selectedDate, t }) {
  const [habits, setHabits] = useState([])
  const [log, setLog] = useState({})
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('reading')
  const isToday = selectedDate.toDateString() === new Date().toDateString()

  useEffect(() => {
    setHabits(loadHabits())
    setLog(loadHabitLog(selectedDate))
  }, [selectedDate])

  function toggleHabit(id) {
    const newLog = { ...log, [id]: !log[id] }
    setLog(newLog)
    saveHabitLog(selectedDate, newLog)
  }

  function addHabit() {
    if (!newName.trim()) return
    const newHabit = { id: Date.now().toString(), name: newName.trim(), icon: newIcon }
    const updated = [...habits, newHabit]
    setHabits(updated)
    saveHabits(updated)
    setNewName('')
    setNewIcon('reading')
    setAdding(false)
  }

  function removeHabit(id) {
    const updated = habits.filter(h => h.id !== id)
    setHabits(updated)
    saveHabits(updated)
  }

  const doneCnt = habits.filter(h => log[h.id]).length

  return (
    <div className="fade-in">
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-glow" />
        <div className="card-header">
          <div className="card-icon">
            <CheckSquare size={18} />
          </div>
          <div>
            <div className="card-title">{t.habits_today} — {isToday ? t.today : fmt(selectedDate, 'bs')}</div>
            <div className="card-sub">{doneCnt}/{habits.length} {t.habits_done}</div>
          </div>
        </div>

        {habits.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-dimmer)', textAlign: 'center', padding: '12px 0' }}>
            {t.add_first_habit}
          </div>
        )}

        {habits.map(h => (
          <div key={h.id} className="habit-item" onClick={() => toggleHabit(h.id)}>
            <div className="habit-icon-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon id={h.icon} size={18} />
            </div>
            <span className="habit-name" style={{ textDecoration: log[h.id] ? 'line-through' : 'none', color: log[h.id] ? 'var(--text-dim)' : 'var(--text)' }}>
              {h.name}
            </span>
            <div className={`habit-done-box${log[h.id] ? ' on' : ''}`} />
            <button
              onClick={e => { e.stopPropagation(); removeHabit(h.id) }}
              style={{ background: 'none', border: 'none', color: 'var(--text-dimmer)', fontSize: 16, cursor: 'pointer', padding: '0 4px', marginLeft: 4 }}
            >×</button>
          </div>
        ))}

        {habits.length > 0 && (
          <div className="progress-bar" style={{ marginTop: 10 }}>
            <div className="progress-fill green" style={{ width: `${habits.length ? Math.round(doneCnt/habits.length*100) : 0}%` }} />
          </div>
        )}
      </div>

      {adding ? (
        <div className="card" style={{ marginBottom: 10 }}>
          <div className="card-glow" />
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>{t.new_habit}</div>
          <div className="field">
            <label className="field-label">{t.habit_name}</label>
            <input
              className="field-input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="..."
              onKeyDown={e => e.key === 'Enter' && addHabit()}
              autoFocus
            />
          </div>
          <div className="field">
            <label className="field-label">{t.habit_icon}</label>
            <div className="emoji-picker">
              {PICKER_ICONS.map(id => (
                <button type="button" key={id} className={`emoji-opt${newIcon === id ? ' on' : ''}`} onClick={() => setNewIcon(id)}>
                  <Icon id={id} size={18} />
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={addHabit}>{t.add}</button>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setAdding(false)}>{t.cancel}</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-outline" onClick={() => setAdding(true)}>
          <Plus size={16} />
          {t.add_habit}
        </button>
      )}
    </div>
  )
}

export default function PlannerScreen() {
  const { settings, t, selectedDate, setSelectedDate } = useApp()
  const [tab, setTab] = useState('daily')
  const [dailyData, setDailyData] = useState({})
  const [weeklyData, setWeeklyData] = useState({})
  const [saved, setSaved] = useState(false)
  const [routine, setRoutine] = useState(loadRoutineConfig)
  const [editingRoutine, setEditingRoutine] = useState(false)
  const [newRoutineLabel, setNewRoutineLabel] = useState('')
  const [newRoutineIcon, setNewRoutineIcon] = useState('morning')

  useEffect(() => {
    setDailyData(loadDayData(selectedDate))
    setWeeklyData(loadWeekData(selectedDate))
  }, [selectedDate])

  function setD(key, val) { setDailyData(p => ({ ...p, [key]: val })) }
  function setW(key, val) { setWeeklyData(p => ({ ...p, [key]: val })) }

  function doSave() {
    if (tab === 'daily') saveDayData(selectedDate, dailyData)
    else if (tab === 'weekly') saveWeekData(selectedDate, weeklyData)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function prevDay() { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d) }
  function nextDay() { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d) }
  const isToday = selectedDate.toDateString() === new Date().toDateString()

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">PLANER</div>
          <div className="screen-title">{t.planner}</div>
          <div className="screen-sub">{fmt(selectedDate, settings.lang)}{isToday ? ` · ${t.today}` : ''}</div>
        </div>
        {!isToday && (
          <button className="btn btn-ghost" onClick={() => setSelectedDate(new Date())} style={{ fontSize: 12, padding: '6px 12px', border: '0.5px solid var(--card-border)', borderRadius: 8 }}>
            {t.today_btn}
          </button>
        )}
      </div>

      {/* Date nav */}
      {tab !== 'habits' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <button className="cal-nav" onClick={prevDay}>
            <CaretLeft size={16} />
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            {fmt(selectedDate, settings.lang)}
          </div>
          <button className="cal-nav" onClick={nextDay}>
            <CaretRight size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['daily', 'weekly', 'habits'].map(id => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '9px', borderRadius: 8, border: 'none',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: tab === id ? 'var(--accent)' : 'var(--card)',
              color: tab === id ? 'white' : 'var(--text-dim)',
              transition: 'all 0.15s'
            }}
          >
            {id === 'daily' ? t.daily : id === 'weekly' ? t.weekly : t.habits}
          </button>
        ))}
      </div>

      {/* Daily Tab */}
      {tab === 'daily' && (
        <div className="fade-in">
          <div className="card">
            <div className="card-glow" />
            <div className="card-header">
              <div className="card-icon">
                <Heart weight="fill" size={18} />
              </div>
              <div className="card-title">{t.checkin}</div>
            </div>
            <div className="field-row c3">
              <div className="field"><label className="field-label">{t.feeling}</label><input className="field-input" value={dailyData.feeling||''} onChange={e=>setD('feeling',e.target.value)} placeholder="1-10" /></div>
              <div className="field"><label className="field-label">{t.energy}</label><input className="field-input" value={dailyData.energy||''} onChange={e=>setD('energy',e.target.value)} placeholder="1-10" /></div>
              <div className="field"><label className="field-label">{t.sleep}</label><input className="field-input" value={dailyData.sleep||''} onChange={e=>setD('sleep',e.target.value)} placeholder="8" /></div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 10 }}>
            <div className="card-glow" />
            <div className="card-header">
              <div className="card-icon">
                <Sun weight="fill" size={18} />
              </div>
              <div className="card-title" style={{ flex: 1 }}>{t.morning_rituals}</div>
              <button
                onClick={() => setEditingRoutine(p => !p)}
                style={{ background: editingRoutine ? 'var(--accent-dim)' : 'transparent', border: `0.5px solid ${editingRoutine ? 'var(--accent)' : 'var(--card-border)'}`, borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: editingRoutine ? 'var(--accent)' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'inherit', fontWeight: 600 }}
              >
                {editingRoutine
                  ? <><Check size={12} />{t.done_label}</>
                  : <><PencilSimple size={12} />{t.edit_label}</>
                }
              </button>
            </div>
            {routine.map(item => (
              <div key={item.id} className="check-row" onClick={() => !editingRoutine && setD(item.id, !dailyData[item.id])}>
                <div className={`check-box${dailyData[item.id] ? ' on' : ''}`} style={{ opacity: editingRoutine ? 0.3 : 1 }} />
                <span className="check-label" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Icon id={item.icon || item.emoji} size={16} color="var(--accent)" />
                  {item.label}
                </span>
                {editingRoutine && (
                  <button onClick={e => { e.stopPropagation(); const updated = routine.filter(r => r.id !== item.id); setRoutine(updated); saveRoutineConfig(updated) }}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 18, padding: '0 6px', lineHeight: 1 }}>×</button>
                )}
              </div>
            ))}

            {editingRoutine && (
              <div style={{ marginTop: 10, borderTop: '0.5px solid var(--card-border)', paddingTop: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600 }}>{t.add_item}</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  {PICKER_ICONS.map(id => (
                    <button type="button" key={id} onClick={() => setNewRoutineIcon(id)}
                      style={{ width: 34, height: 34, background: newRoutineIcon === id ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${newRoutineIcon === id ? 'var(--accent)' : 'var(--card-border)'}`, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: newRoutineIcon === id ? 'var(--accent)' : 'var(--text-dim)' }}>
                      <Icon id={id} size={16} />
                    </button>
                  ))}
                </div>
                <input
                  className="field-input"
                  style={{ width: '100%', marginBottom: 8 }}
                  value={newRoutineLabel}
                  onChange={e => setNewRoutineLabel(e.target.value)}
                  placeholder={t.item_name_placeholder}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', opacity: newRoutineLabel.trim() ? 1 : 0.4 }}
                  onClick={() => {
                    if (!newRoutineLabel.trim()) return
                    const newItem = { id: `custom_${Date.now()}`, label: newRoutineLabel.trim(), icon: newRoutineIcon }
                    const updated = [...routine, newItem]
                    setRoutine(updated)
                    saveRoutineConfig(updated)
                    setNewRoutineLabel('')
                    setNewRoutineIcon('morning')
                  }}
                >
                  {t.add_btn}
                </button>
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: 10 }}>
            <div className="card-glow" />
            <div className="card-header">
              <div className="card-icon">
                <ClipboardText size={18} />
              </div>
              <div className="card-title">{t.priority_tasks}</div>
            </div>
            {[1,2,3].map(i => (
              <div key={i} className="task-row">
                <input className="field-input" style={{ flex: 1 }} placeholder={`${t.task_n} ${i}...`} value={dailyData[`task${i}`]||''} onChange={e=>setD(`task${i}`,e.target.value)} />
                <div className="task-check" onClick={() => setD(`task${i}Done`, !dailyData[`task${i}Done`])}>
                  <div className={`check-box${dailyData[`task${i}Done`] ? ' on' : ''}`} />
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 10 }}>
            <div className="card-glow" />
            <div className="card-header">
              <div className="card-icon">
                <PencilSimple size={18} />
              </div>
              <div className="card-title">{t.reflection}</div>
            </div>
            {[[t.wins,'wins'],[t.challenges,'challenges'],[t.gratitude,'gratitude'],[t.notes,'notes']].map(([label,key]) => (
              <div key={key} className="field">
                <label className="field-label">{label}</label>
                <textarea className="field-textarea" value={dailyData[key]||''} onChange={e=>setD(key,e.target.value)} placeholder={label + '...'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Tab */}
      {tab === 'weekly' && (
        <div className="fade-in">
          <div className="card">
            <div className="card-glow" />
            <div className="card-header">
              <div className="card-icon">
                <Star weight="fill" size={18} />
              </div>
              <div className="card-title">{t.weekly_goals}</div>
            </div>
            {[1,2,3].map(i => (
              <div key={i} className="field">
                <label className="field-label">{t.goal_n} {i}</label>
                <input className="field-input" value={weeklyData[`goal${i}`]||''} onChange={e=>setW(`goal${i}`,e.target.value)} placeholder={`${t.weekly_goals} ${i}...`} />
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 10 }}>
            <div className="card-glow" />
            <div className="card-header">
              <div className="card-icon">
                <ChartBar weight="fill" size={18} />
              </div>
              <div className="card-title">{t.business_metrics}</div>
            </div>
            <div className="field-row c3">
              {[[t.revenue,'revenue'],[t.new_clients,'clients'],[t.projects,'projects']].map(([label,key]) => (
                <div key={key} className="field">
                  <label className="field-label">{label}</label>
                  <input className="field-input" value={weeklyData[key]||''} onChange={e=>setW(key,e.target.value)} placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop: 10 }}>
            <div className="card-glow" />
            <div className="card-header">
              <div className="card-icon">
                <PencilSimple size={18} />
              </div>
              <div className="card-title">{t.weekly_reflection}</div>
            </div>
            {[[t.reflection,'reflection'],[t.next_week,'nextWeekFocus']].map(([label,key]) => (
              <div key={key} className="field">
                <label className="field-label">{label}</label>
                <textarea className="field-textarea" value={weeklyData[key]||''} onChange={e=>setW(key,e.target.value)} placeholder={label + '...'} />
              </div>
            ))}
            <div className="field">
              <label className="field-label">{t.score}</label>
              <div className="chips">
                {['1','2','3','4','5','6','7','8','9','10'].map(v => (
                  <button key={v} className={`chip${weeklyData.score===v?' on':''}`} onClick={() => setW('score',v)}>{v}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'habits' && <HabitsTab selectedDate={selectedDate} t={t} />}

      {tab !== 'habits' && (
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={doSave} style={{ background: saved ? 'var(--green)' : 'var(--accent)' }}>
            {saved ? (
              <><Check size={16} />{t.saved}</>
            ) : (
              <><FloppyDisk weight="fill" size={16} />{t.save}</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
