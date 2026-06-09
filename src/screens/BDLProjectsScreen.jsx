import { useState } from 'react'
import { useApp } from '../App.jsx'
import { loadBDLProjects, saveBDLProjects, loadBDLClients } from '../utils/storage.js'

const STATUSES = { offer: { label: 'Angebot', color: '#F59E0B' }, active: { label: 'Aktiv', color: 'var(--green)' }, paused: { label: 'Pauza', color: 'var(--text-dim)' }, done: { label: 'Gotovo', color: 'var(--accent)' }, cancelled: { label: 'Otkazano', color: 'var(--red)' } }
const TYPES = ['IT Support', 'Cybersecurity', 'NIS2/DSGVO', 'Website', 'App', 'Automation', 'AI Consulting', 'Buchungssystem', 'Sonstiges']
const BLANK = { name: '', clientName: '', type: 'IT Support', status: 'offer', value: '', recurring: false, deadline: '', notes: '' }

export default function BDLProjectsScreen() {
  const { t } = useApp()
  const [projects, setProjects] = useState(loadBDLProjects())
  const clients = loadBDLClients()
  const [tab, setTab] = useState('active')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)

  function save(list) { setProjects(list); saveBDLProjects(list) }
  function openAdd() { setForm({ ...BLANK, id: Math.random().toString(36).slice(2, 9) }); setEditing('new') }
  function openEdit(p) { setForm({ ...p }); setEditing(p.id) }
  function submitForm() {
    if (!form.name) return
    if (editing === 'new') save([...projects, form])
    else save(projects.map(p => p.id === editing ? form : p))
    setEditing(null)
  }
  function deleteProject(id) { save(projects.filter(p => p.id !== id)); setEditing(null) }

  const byStatus = {
    active: projects.filter(p => p.status === 'active' || p.status === 'offer'),
    done: projects.filter(p => p.status === 'done' || p.status === 'cancelled' || p.status === 'paused'),
  }
  const shown = byStatus[tab] || []

  const activeRevenue = projects.filter(p => p.status === 'active' && p.recurring).reduce((s, p) => s + (Number(p.value) || 0), 0)
  const pipelineValue = projects.filter(p => p.status === 'offer').reduce((s, p) => s + (Number(p.value) || 0), 0)

  if (editing !== null) {
    return (
      <div className="screen fade-in">
        <div className="screen-header">
          <div>
          <div className="screen-label">PROJEKTE</div><div className="screen-title">{editing === 'new' ? t.new_project : t.edit_project}</div></div>
        </div>
        <div className="card">
          <div className="field" style={{ marginBottom: 10 }}>
            <label className="field-label">{t.project_name}</label>
            <input className="field-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="npr. NIS2 Beratung" />
          </div>
          <div className="field-row c2" style={{ marginBottom: 10 }}>
            <div className="field">
              <label className="field-label">{t.project_client}</label>
              <input className="field-input" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="Dr. Müller" list="proj-clients" />
              <datalist id="proj-clients">{clients.map(c => <option key={c.id} value={c.name} />)}</datalist>
            </div>
            <div className="field">
              <label className="field-label">{t.project_type}</label>
              <select className="field-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{TYPES.map(tp => <option key={tp}>{tp}</option>)}</select>
            </div>
          </div>
          <div className="field-row c2" style={{ marginBottom: 10 }}>
            <div className="field">
              <label className="field-label">{t.project_status}</label>
              <select className="field-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>{Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
            </div>
            <div className="field">
              <label className="field-label">{t.deadline_label}</label>
              <input className="field-input" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
          </div>
          <div className="field-row c2" style={{ marginBottom: 10 }}>
            <div className="field">
              <label className="field-label">{t.project_value}</label>
              <input className="field-input" type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0" />
            </div>
            <div className="field" style={{ justifyContent: 'flex-end' }}>
              <label className="field-label">Recurring</label>
              <div className="check-row" style={{ marginTop: 8 }} onClick={() => setForm(f => ({ ...f, recurring: !f.recurring }))}>
                <div className={`check-box${form.recurring ? ' on' : ''}`} />
                <span className="check-label" style={{ fontSize: 12 }}>{t.monthly_label}</span>
              </div>
            </div>
          </div>
          <div className="field">
            <label className="field-label">{t.project_notes}</label>
            <textarea className="field-input" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t.project_notes_placeholder} style={{ resize: 'none' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {editing !== 'new' && <button className="btn btn-outline" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => deleteProject(editing)}>{t.delete_label}</button>}
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
          <div className="screen-title">{t.projects_title}</div>
          <div className="screen-sub">{projects.filter(p => p.status === 'active').length} {t.active_projects_sub}</div>
        </div>
      </div>

      <div className="field-row c2">
        <div className="card" style={{ textAlign: 'center', padding: '12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>{t.active_income}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{activeRevenue}€<span style={{ fontSize: 11, fontWeight: 400 }}>/mo</span></div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>{t.pipeline_val}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B' }}>{pipelineValue}€</div>
        </div>
      </div>

      <div className="set-row" style={{ marginBottom: 12 }}>
        <button className={`set-btn${tab === 'active' ? ' on' : ''}`} onClick={() => setTab('active')}>{t.active_offers_tab}</button>
        <button className={`set-btn${tab === 'done' ? ' on' : ''}`} onClick={() => setTab('done')}>{t.done_tab}</button>
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dimmer)', fontSize: 13 }}>{t.no_projects}</div>
      ) : shown.map(p => (
        <div key={p.id} className="card" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => openEdit(p)}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.clientName} · {p.type}</div>
              {p.deadline && <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginTop: 2 }}>Rok: {new Date(p.deadline).toLocaleDateString('de-DE')}</div>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: STATUSES[p.status]?.color, marginBottom: 3 }}>{STATUSES[p.status]?.label}</div>
              {p.value ? <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{p.value}€{p.recurring ? '/mo' : ''}</div> : null}
            </div>
          </div>
        </div>
      ))}

      <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={openAdd}>{t.add_project_btn}</button>
    </div>
  )
}
