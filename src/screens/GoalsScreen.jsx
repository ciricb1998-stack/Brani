import { useState, useEffect } from 'react'
import { useApp } from '../App.jsx'
import { IconBlock, PILLAR_COLORS } from '../data/icons.jsx'
import { FileText, Star, Target, Clock, Pulse } from '@phosphor-icons/react'
import {
  saveMonthlyGoals, loadMonthlyGoals,
  saveQuarterlyGoal, loadQuarterlyGoal,
  saveYearlyGoal, loadYearlyGoal,
  saveFootballLog, loadFootballLog, loadFootballMonth,
  saveFootballProfile, loadFootballProfile
} from '../utils/storage.js'

const SESSION_TYPES_BS = ['Trening', 'Rehab', 'Odmor', 'Utakmica', 'Testiranje']
const PHASES_BS = ['Oporavak', 'Rehabilitacija', 'Trening', 'Puna aktivnost']
const PHASE_COLORS = { 'Oporavak': 'var(--red)', 'Rehabilitacija': 'var(--amber)', 'Trening': 'var(--blue)', 'Puna aktivnost': 'var(--green)' }

function PainScale({ value, onChange }) {
  const getColor = v => v <= 2 ? 'var(--green)' : v <= 5 ? 'var(--amber)' : 'var(--red)'
  return (
    <div className="pain-scale">
      {[0,1,2,3,4,5,6,7,8,9,10].map(v => (
        <button
          key={v} className="pain-dot" onClick={() => onChange(v)}
          style={{
            background: value === v ? getColor(v) : 'var(--card)',
            color: value === v ? 'white' : 'var(--text-dim)',
            border: value === v ? 'none' : '0.5px solid var(--card-border)'
          }}
        >{v}</button>
      ))}
    </div>
  )
}

function GoalsTab({ t }) {
  const { settings } = useApp()
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const [activeQ, setActiveQ] = useState(Math.ceil(month / 3))
  const [monthlyGoals, setMonthlyGoals] = useState([])
  const [qGoal, setQGoal] = useState({ text: '', done: false })
  const [yearlyGoal, setYearlyGoal] = useState({ vision: '', business: '', football: '', health: '', personal: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setMonthlyGoals(loadMonthlyGoals(year, month))
    setYearlyGoal(loadYearlyGoal(year))
  }, [])

  useEffect(() => {
    setQGoal(loadQuarterlyGoal(year, activeQ))
  }, [activeQ])

  function addGoal() {
    const newGoals = [...monthlyGoals, { id: Date.now().toString(), text: '', done: false }]
    setMonthlyGoals(newGoals)
    saveMonthlyGoals(year, month, newGoals)
  }

  function updateGoal(id, patch) {
    const updated = monthlyGoals.map(g => g.id === id ? { ...g, ...patch } : g)
    setMonthlyGoals(updated)
    saveMonthlyGoals(year, month, updated)
  }

  function removeGoal(id) {
    const updated = monthlyGoals.filter(g => g.id !== id)
    setMonthlyGoals(updated)
    saveMonthlyGoals(year, month, updated)
  }

  function saveAll() {
    saveQuarterlyGoal(year, activeQ, qGoal)
    saveYearlyGoal(year, yearlyGoal)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const doneCount = monthlyGoals.filter(g => g.done).length
  const quarterRanges = { 1: 'Jan–Mar', 2: 'Apr–Jun', 3: 'Jul–Sep', 4: 'Okt–Dec' }

  return (
    <div className="fade-in">
      {/* Monthly goals */}
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-glow" />
        <div className="card-header">
          <div className="card-icon">
            <FileText size={18} />
          </div>
          <div>
            <div className="card-title">{t.monthly_goals}</div>
            <div className="card-sub">{doneCount}/{monthlyGoals.length} {t.habits_done}</div>
          </div>
          <button
            onClick={addGoal} disabled={monthlyGoals.length >= 7}
            style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: 7, background: 'var(--accent-dim)', border: 'none', color: 'var(--accent)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >+</button>
        </div>

        {monthlyGoals.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-dimmer)', textAlign: 'center', padding: '12px 0' }}>
            {t.add_first_goal}
          </div>
        )}

        {monthlyGoals.map(g => (
          <div key={g.id} className="goal-item">
            <div
              onClick={() => updateGoal(g.id, { done: !g.done })}
              style={{ width: 22, height: 22, borderRadius: 6, border: g.done ? 'none' : '1.5px solid var(--card-border)', background: g.done ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s' }}>
              {g.done && <span style={{ fontSize: 12, color: 'white', fontWeight: 700 }}>✓</span>}
            </div>
            <input
              className="goal-input" value={g.text}
              onChange={e => updateGoal(g.id, { text: e.target.value })}
              placeholder={t.enter_goal}
              style={{ textDecoration: g.done ? 'line-through' : 'none', color: g.done ? 'var(--text-dim)' : 'var(--text)' }}
            />
            <button onClick={() => removeGoal(g.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dimmer)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
          </div>
        ))}

        {monthlyGoals.length > 0 && (
          <div className="progress-bar" style={{ marginTop: 10 }}>
            <div className="progress-fill green" style={{ width: `${Math.round(doneCount / monthlyGoals.length * 100)}%` }} />
          </div>
        )}
      </div>

      {/* Quarterly goals */}
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-glow" />
        <div className="card-header">
          <div className="card-icon">
            <Star weight="fill" size={18} />
          </div>
          <div>
            <div className="card-title">{t.quarterly_goal} {activeQ} — {year}</div>
            <div className="card-sub">{quarterRanges[activeQ]}</div>
          </div>
        </div>
        <div className="quarter-selector">
          {[1,2,3,4].map(q => (
            <button key={q} className={`quarter-btn${activeQ === q ? ' on' : ''}`} onClick={() => setActiveQ(q)}>Q{q}</button>
          ))}
        </div>
        <div className="field">
          <textarea
            className="field-textarea" style={{ height: 80 }}
            value={qGoal.text}
            onChange={e => setQGoal(p => ({ ...p, text: e.target.value }))}
            placeholder={`Q${activeQ}...`}
          />
        </div>
        <div className="check-row" onClick={() => setQGoal(p => ({ ...p, done: !p.done }))}>
          <div className={`check-box${qGoal.done ? ' on' : ''}`} />
          <span className="check-label" style={{ fontSize: 13 }}>{t.quarter_done}</span>
        </div>
      </div>

      {/* Yearly vision */}
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-glow" />
        <div className="card-header">
          <div className="card-icon">
            <Target weight="fill" size={18} />
          </div>
          <div className="card-title">{t.yearly_vision} — {year}</div>
        </div>
        <div className="field">
          <label className="field-label">{t.vision}</label>
          <textarea
            className="field-textarea" style={{ height: 80 }}
            value={yearlyGoal.vision}
            onChange={e => setYearlyGoal(p => ({ ...p, vision: e.target.value }))}
            placeholder="..."
          />
        </div>
      </div>

      <div className="section-title">{t.pillars_title} — {year}</div>
      <div className="pillar-grid" style={{ marginBottom: 10 }}>
        {[
          { key: 'business', label: t.business, icon: 'business' },
          { key: 'football', label: t.football, icon: 'football' },
          { key: 'health',   label: t.health,   icon: 'health'   },
          { key: 'personal', label: t.personal, icon: 'personal' },
        ].map(({ key, label, icon }) => {
          const p = PILLAR_COLORS[key]
          return (
            <div key={key} className="pillar-card" style={{ borderColor: p.border, background: p.bg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <IconBlock id={icon} size={26} bg={p.bg} color={p.color} radius={7} />
                <div className="pillar-label" style={{ color: p.color, marginBottom: 0 }}>{label}</div>
              </div>
              <textarea
                className="field-textarea"
                style={{ height: 60, background: 'transparent', border: 'none', padding: '0', outline: 'none', resize: 'none', fontSize: 12 }}
                value={yearlyGoal[key] || ''}
                onChange={e => setYearlyGoal(p => ({ ...p, [key]: e.target.value }))}
                placeholder="..."
              />
            </div>
          )
        })}
      </div>

      <button className="btn btn-primary" onClick={saveAll} style={{ background: saved ? 'var(--green)' : 'var(--accent)' }}>
        {saved ? '✓ ' + t.saved : t.save_goals}
      </button>
    </div>
  )
}

function FootballTab({ t }) {
  const today = new Date()
  const [log, setLog] = useState(loadFootballLog(today))
  const [profile, setProfile] = useState(loadFootballProfile())
  const [editProfile, setEditProfile] = useState(false)
  const [saved, setSaved] = useState(false)
  const monthLogs = loadFootballMonth(today.getFullYear(), today.getMonth() + 1)

  function saveLog() {
    saveFootballLog(today, { ...log, done: true })
    if (editProfile) saveFootballProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const trainingSessions = monthLogs.filter(l => l.type === 'Trening' || l.type === 'Utakmica').length
  const rehabSessions = monthLogs.filter(l => l.type === 'Rehab').length
  const avgPain = monthLogs.length
    ? (monthLogs.reduce((s, l) => s + (Number(l.pain) || 0), 0) / monthLogs.length).toFixed(1)
    : '--'
  const phaseColor = PHASE_COLORS[profile.phase] || 'var(--accent)'
  const locale = 'de-DE'

  return (
    <div className="fade-in">
      {/* Injury profile */}
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-glow" style={{ background: 'rgba(239,68,68,0.06)' }} />
        <div className="card-header">
          <div className="card-icon" style={{ background: 'var(--red-dim)' }}>
            <Pulse weight="fill" size={18} style={{ color: 'var(--red)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title" style={{ color: 'var(--red)' }}>{t.injury_profile}</div>
            <div className="card-sub">{profile.injuryType || t.not_set}</div>
          </div>
          <button onClick={() => setEditProfile(p => !p)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>
            {editProfile ? t.close : t.edit}
          </button>
        </div>

        {!editProfile ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{t.phase_label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: phaseColor, background: `${phaseColor}20`, padding: '2px 10px', borderRadius: 100 }}>
                {profile.phase || t.not_set_f}
              </span>
            </div>
            {profile.targetReturn && (
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                {t.return_goal}: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{profile.targetReturn}</span>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="field">
              <label className="field-label">{t.injury_type}</label>
              <input className="field-input" value={profile.injuryType} onChange={e => setProfile(p => ({ ...p, injuryType: e.target.value }))} placeholder="..." />
            </div>
            <div className="field-row c2">
              <div className="field">
                <label className="field-label">{t.injury_date}</label>
                <input className="field-input" type="date" value={profile.injuryDate} onChange={e => setProfile(p => ({ ...p, injuryDate: e.target.value }))} />
              </div>
              <div className="field">
                <label className="field-label">{t.return_target}</label>
                <input className="field-input" type="date" value={profile.targetReturn} onChange={e => setProfile(p => ({ ...p, targetReturn: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label className="field-label">{t.phase}</label>
              <div className="session-types">
                {PHASES_BS.map(ph => (
                  <button key={ph} className={`session-type${profile.phase === ph ? ' on' : ''}`} onClick={() => setProfile(p => ({ ...p, phase: ph }))}>
                    {ph}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly stats */}
      <div className="stat-bar" style={{ marginBottom: 10 }}>
        <div className="stat-card">
          <div className="stat-label">{t.trainings_label}</div>
          <div className="stat-value">{trainingSessions}</div>
          <div className="stat-sub">{t.this_month_short}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.rehab_label}</div>
          <div className="stat-value">{rehabSessions}</div>
          <div className="stat-sub">{t.sessions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.avg_pain}</div>
          <div className="stat-value" style={{ color: Number(avgPain) > 5 ? 'var(--red)' : 'var(--green)' }}>{avgPain}</div>
          <div className="stat-sub">/ 10</div>
        </div>
      </div>

      {/* Today's session */}
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-glow" />
        <div className="card-header">
          <div className="card-icon">
            <Clock weight="fill" size={18} />
          </div>
          <div>
            <div className="card-title">{t.session_today}</div>
            <div className="card-sub">{today.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long' })}</div>
          </div>
        </div>

        <div className="field">
          <label className="field-label">{t.session_type}</label>
          <div className="session-types">
            {SESSION_TYPES_BS.map(type => (
              <button key={type} className={`session-type${log.type === type ? ' on' : ''}`} onClick={() => setLog(p => ({ ...p, type }))}>{type}</button>
            ))}
          </div>
        </div>

        <div className="field-row c2" style={{ marginTop: 10 }}>
          <div className="field">
            <label className="field-label">{t.duration_min}</label>
            <input className="field-input" type="number" value={log.duration} onChange={e => setLog(p => ({ ...p, duration: e.target.value }))} placeholder="60" />
          </div>
          <div className="field" />
        </div>

        <div className="field">
          <label className="field-label">{t.pain_label} {log.pain}/10</label>
          <div style={{ marginTop: 4 }}>
            <PainScale value={Number(log.pain)} onChange={v => setLog(p => ({ ...p, pain: v }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--text-dimmer)' }}>
            <span>{t.no_pain}</span>
            <span>{t.moderate}</span>
            <span>{t.strong_pain}</span>
          </div>
        </div>

        <div className="field">
          <label className="field-label">{t.session_notes}</label>
          <textarea className="field-textarea" value={log.notes} onChange={e => setLog(p => ({ ...p, notes: e.target.value }))} placeholder="..." />
        </div>
      </div>

      {/* Recent sessions */}
      {monthLogs.length > 0 && (
        <>
          <div className="section-title">{t.recent_sessions}</div>
          <div className="card" style={{ marginBottom: 10 }}>
            <div className="card-glow" />
            {monthLogs.slice(-7).reverse().map((s, i) => {
              const typeColors = { 'Trening': 'var(--blue)', 'Rehab': 'var(--amber)', 'Odmor': 'var(--text-dim)', 'Utakmica': 'var(--green)', 'Testiranje': 'var(--purple)' }
              const col = typeColors[s.type] || 'var(--accent)'
              return (
                <div key={i} className="football-session-item">
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', width: 42, flexShrink: 0 }}>
                    {s.date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}
                  </div>
                  <span className="session-badge" style={{ background: `${col}20`, color: col }}>{s.type}</span>
                  {s.duration && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{s.duration}min</span>}
                  {s.pain > 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: s.pain > 5 ? 'var(--red)' : 'var(--green)' }}>
                      {t.pain_label.replace(' —','')} {s.pain}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <button className="btn btn-primary" onClick={saveLog} style={{ background: saved ? 'var(--green)' : 'var(--accent)' }}>
        {saved ? '✓ ' + t.saved : t.save_session}
      </button>
    </div>
  )
}

export default function GoalsScreen() {
  const { t } = useApp()
  const [tab, setTab] = useState('goals')

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">ZIELE</div>
          <div className="screen-title">{tab === 'goals' ? t.goals : t.goals_football}</div>
          <div className="screen-sub">{tab === 'goals' ? t.missions_sub : t.recovery_sub}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[
          { id: 'goals', label: t.goals, icon: <Target weight="fill" size={15} /> },
          { id: 'football', label: t.goals_football, icon: <Pulse weight="fill" size={15} /> },
        ].map(({ id, label, icon }) => (
          <button
            key={id} onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '9px', borderRadius: 8, border: 'none',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: tab === id ? 'var(--accent)' : 'var(--card)',
              color: tab === id ? 'white' : 'var(--text-dim)',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >{icon}{label}</button>
        ))}
      </div>

      {tab === 'goals' ? <GoalsTab t={t} /> : <FootballTab t={t} />}
    </div>
  )
}
