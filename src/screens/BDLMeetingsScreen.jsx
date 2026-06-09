import { useState } from 'react'
import { useApp } from '../App.jsx'
import { loadBDLMeetings, saveBDLMeetings, loadBDLClients } from '../utils/storage.js'
import { Icon } from '../data/icons.jsx'
import { hasSlack, sendToSlack, slackMeetingMsg } from '../utils/slack.js'

const TYPES = {
  call:   { emoji: '📞', icon: 'call',   color: '#3b82f6' },
  video:  { emoji: '🎥', icon: 'video',  color: '#a855f7' },
  onsite: { emoji: '🤝', icon: 'onsite', color: '#22c55e' },
  other:  { emoji: '📋', icon: 'other',  color: '#f59e0b' },
}
const BLANK = { title: '', clientName: '', type: 'call', date: '', notes: '', outcome: '', nextSteps: '', done: false }

export default function BDLMeetingsScreen() {
  const { t, settings } = useApp()
  const TYPE_LABELS = {
    call:   t?.meeting_type_call   || 'Telefonski',
    video:  t?.meeting_type_video  || 'Video',
    onsite: t?.meeting_type_onsite || 'Lično',
    other:  t?.meeting_type_other  || 'Ostalo',
  }
  const [meetings, setMeetings] = useState(loadBDLMeetings())
  const clients = loadBDLClients()
  const [tab, setTab] = useState('upcoming')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [slackFlash, setSlackFlash] = useState(null)
  const slackEnabled = hasSlack()

  async function sendMeetingToSlack(m) {
    const result = await sendToSlack(slackMeetingMsg(m, settings.lang))
    if (result.ok) {
      setSlackFlash(m.id)
      setTimeout(() => setSlackFlash(null), 2000)
    }
  }

  function save(list) { setMeetings(list); saveBDLMeetings(list) }
  function openAdd() { setForm({ ...BLANK, id: Math.random().toString(36).slice(2, 9) }); setEditing('new') }
  function openEdit(m) { setForm({ ...m }); setEditing(m.id) }
  function submitForm() {
    if (!form.title) return
    if (editing === 'new') save([...meetings, form])
    else save(meetings.map(m => m.id === editing ? form : m))
    setEditing(null)
  }
  function toggleDone(id) { save(meetings.map(m => m.id === id ? { ...m, done: !m.done } : m)) }
  function deleteMeeting(id) { save(meetings.filter(m => m.id !== id)); setEditing(null) }

  const today = new Date().toISOString().split('T')[0]
  const upcoming = meetings.filter(m => !m.done && m.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past = meetings.filter(m => m.done || m.date < today).sort((a, b) => b.date.localeCompare(a.date))
  const shown = tab === 'upcoming' ? upcoming : past

  if (editing !== null) {
    return (
      <div className="screen fade-in">
        <div className="screen-header">
          <div>
          <div className="screen-label">MEETINGS</div><div className="screen-title">{editing === 'new' ? t.new_meeting : t.edit_meeting}</div></div>
        </div>
        <div className="card">
          <div className="field" style={{ marginBottom: 10 }}>
            <label className="field-label">{t.meeting_topic}</label>
            <input className="field-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="npr. Erstgespräch" />
          </div>
          <div className="field-row c2" style={{ marginBottom: 10 }}>
            <div className="field">
              <label className="field-label">{t.client_name}</label>
              <input className="field-input" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="Dr. Müller" list="clients-list" />
              <datalist id="clients-list">{clients.map(c => <option key={c.id} value={c.name} />)}</datalist>
            </div>
            <div className="field">
              <label className="field-label">{t.meeting_type}</label>
              <select className="field-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {TYPE_LABELS[k]}</option>)}
              </select>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label className="field-label">{t.datetime_label}</label>
            <input className="field-input" type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label className="field-label">{t.agenda_label}</label>
            <textarea className="field-input" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t.agenda_placeholder} style={{ resize: 'none' }} />
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label className="field-label">{t.outcome_label}</label>
            <textarea className="field-input" rows={2} value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} placeholder={t.outcome_placeholder} style={{ resize: 'none' }} />
          </div>
          <div className="field">
            <label className="field-label">{t.next_steps_label}</label>
            <input className="field-input" value={form.nextSteps} onChange={e => setForm(f => ({ ...f, nextSteps: e.target.value }))} placeholder={t.next_steps_placeholder} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {editing !== 'new' && <button className="btn btn-outline" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => deleteMeeting(editing)}>{t.delete_label}</button>}
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditing(null)}>{t.cancel_label}</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={submitForm}>{t.save_label}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-title">{t.meetings_title}</div>
          <div className="screen-sub">{upcoming.length} {t.upcoming_count}</div>
        </div>
      </div>

      <div className="set-row" style={{ marginBottom: 12 }}>
        <button className={`set-btn${tab === 'upcoming' ? ' on' : ''}`} onClick={() => setTab('upcoming')}>{t.upcoming_tab} ({upcoming.length})</button>
        <button className={`set-btn${tab === 'past' ? ' on' : ''}`} onClick={() => setTab('past')}>{t.past_tab} ({past.length})</button>
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dimmer)', fontSize: 13 }}>
          {tab === 'upcoming' ? t.no_upcoming_meetings : t.no_past_meetings}
        </div>
      ) : shown.map(m => (
        <div key={m.id} className="card" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: m.done ? 'var(--card)' : `${TYPES[m.type]?.color || '#3b82f6'}18`, border: `1px solid ${TYPES[m.type]?.color || '#3b82f6'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: m.done ? 'var(--text-dimmer)' : (TYPES[m.type]?.color || 'var(--accent)') }}>
              <Icon id={TYPES[m.type]?.icon || 'other'} size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => openEdit(m)}>
              <div style={{ fontSize: 13, fontWeight: 600, color: m.done ? 'var(--text-dim)' : 'var(--text)', textDecoration: m.done ? 'line-through' : 'none' }}>{m.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>
                {m.clientName && <span>{m.clientName} · </span>}
                {m.date && <span>{new Date(m.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}{m.date.includes('T') ? ' ' + m.date.split('T')[1].slice(0, 5) : ''}</span>}
              </div>
              {m.nextSteps && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 3 }}>→ {m.nextSteps}</div>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
              {slackEnabled && (
                <button
                  onClick={() => sendMeetingToSlack(m)}
                  style={{ height: 24, padding: '0 8px', borderRadius: 6, border: '1px solid #4A90E222', background: slackFlash === m.id ? '#22c55e22' : '#4A90E211', color: slackFlash === m.id ? 'var(--green)' : '#4A90E2', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.5px', transition: 'all 0.2s' }}
                >
                  {slackFlash === m.id ? t.slack_sent : t.send_to_slack}
                </button>
              )}
              <button onClick={() => toggleDone(m.id)}
                style={{ width: 24, height: 24, borderRadius: 6, border: `1.5px solid ${m.done ? 'var(--green)' : 'var(--card-border)'}`, background: m.done ? 'var(--green)' : 'transparent', color: 'white', fontSize: 12, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {m.done ? '✓' : ''}
              </button>
            </div>
          </div>
        </div>
      ))}

      <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={openAdd}>{t.add_meeting_btn}</button>
    </div>
  )
}
