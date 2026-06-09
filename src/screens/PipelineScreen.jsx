import { useState } from 'react'
import { useApp } from '../App.jsx'
import { loadPipeline, savePipeline } from '../utils/storage.js'
import { Plus, Users, PencilSimple } from '@phosphor-icons/react'

const STAGES = [
  { id: 'lead',      label: 'Lead',      color: '#3b82f6' },
  { id: 'kontakt',   label: 'Kontakt',   color: '#06b6d4' },
  { id: 'ponuda',    label: 'Ponuda',    color: '#f59e0b' },
  { id: 'pregovor',  label: 'Pregovor',  color: '#a855f7' },
  { id: 'klijent',   label: 'Klijent',   color: '#22c55e' },
  { id: 'lost',      label: 'Lost',      color: '#ef4444' },
]

function ProspectForm({ data, onSave, onCancel, isNew }) {
  const { t } = useApp()
  const [f, setF] = useState(data)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, padding: '0 8px 0 0' }}>{t.back_label}</button>
        <div className="screen-title">{isNew ? t.new_prospect_form : t.edit_prospect}</div>
      </div>

      <div className="card">
        <div className="card-glow" />
        {[['name',t.prospect_name,'text'],['company',t.company_label,'text'],['value',t.value_label,'number'],['phone',t.phone_label,'tel'],['email',t.email_label,'email']].map(([k,label,type]) => (
          <div key={k} className="field">
            <label className="field-label">{label}</label>
            <input className="field-input" type={type} value={f[k] || ''} onChange={e => set(k, e.target.value)} />
          </div>
        ))}

        <div className="field">
          <label className="field-label">{t.stage_label}</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STAGES.map(s => (
              <button key={s.id} type="button" onClick={() => set('stage', s.id)} style={{
                padding: '7px 12px', borderRadius: 8, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: f.stage === s.id ? s.color + '20' : 'transparent',
                border: `0.5px solid ${f.stage === s.id ? s.color : 'var(--card-border)'}`,
                color: f.stage === s.id ? s.color : 'var(--text-dim)',
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label">{t.notes_label}</label>
          <textarea className="field-textarea" value={f.notes || ''} onChange={e => set('notes', e.target.value)} placeholder={t.notes_context_placeholder} />
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} onClick={() => onSave(f)}>
          {isNew ? t.add_prospect_btn : t.save_changes_btn}
        </button>
      </div>
    </div>
  )
}

export default function PipelineScreen() {
  const { t } = useApp()
  const [prospects, setProspects] = useState(loadPipeline)
  const [activeStage, setActiveStage] = useState('lead')
  const [editing, setEditing] = useState(null)

  function persist(next) { setProspects(next); savePipeline(next) }

  function saveProspect(f) {
    const next = editing === 'new'
      ? [...prospects, { id: Date.now().toString(), createdAt: new Date().toISOString(), ...f }]
      : prospects.map(p => p.id === editing.id ? { ...p, ...f } : p)
    persist(next)
    setEditing(null)
  }

  function moveStage(id, stageId) {
    persist(prospects.map(p => p.id === id ? { ...p, stage: stageId } : p))
  }

  function del(id) { persist(prospects.filter(p => p.id !== id)) }

  const active = STAGES.find(s => s.id === activeStage)
  const stageItems = prospects.filter(p => p.stage === activeStage)
  const pipelineValue = prospects.filter(p => p.stage !== 'lost').reduce((s, p) => s + (parseFloat(p.value) || 0), 0)
  const closedValue = prospects.filter(p => p.stage === 'klijent').reduce((s, p) => s + (parseFloat(p.value) || 0), 0)

  if (editing !== null) {
    const isNew = editing === 'new'
    const initData = isNew
      ? { name: '', company: '', value: '', phone: '', email: '', notes: '', stage: activeStage }
      : { ...editing }
    return <ProspectForm data={initData} onSave={saveProspect} onCancel={() => setEditing(null)} isNew={isNew} />
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">PIPELINE</div>
          <div className="screen-title">{t.pipeline_title}</div>
          <div className="screen-sub">{t.pipeline_sub}</div>
        </div>
        <button className="btn btn-primary" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setEditing('new')}>
          <Plus size={13} />
          {t.new_btn}
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'PIPELINE', value: `€${pipelineValue.toLocaleString()}`, color: 'var(--accent)' },
          { label: t.closed_label, value: `€${closedValue.toLocaleString()}`, color: '#22c55e' },
          { label: t.pipeline_kpi_active, value: prospects.filter(p => p.stage !== 'lost').length, color: 'var(--text)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 9, color: 'var(--text-dimmer)', letterSpacing: '0.8px', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Stage tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {STAGES.map(s => {
          const count = prospects.filter(p => p.stage === s.id).length
          const isOn = activeStage === s.id
          return (
            <button key={s.id} type="button" onClick={() => setActiveStage(s.id)} style={{
              flexShrink: 0, padding: '7px 12px', borderRadius: 8, fontFamily: 'inherit', cursor: 'pointer',
              background: isOn ? s.color + '20' : 'var(--card)',
              border: `0.5px solid ${isOn ? s.color : 'var(--card-border)'}`,
              color: isOn ? s.color : 'var(--text-dim)',
              fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {s.label}
              {count > 0 && (
                <span style={{ background: isOn ? s.color : 'var(--card-border)', color: isOn ? 'white' : 'var(--text-dimmer)', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Cards */}
      {stageItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: active.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: active.color }}>
            <Users weight="fill" size={24} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dimmer)' }}>{t.no_prospects_stage} {active.label}</div>
        </div>
      ) : (
        stageItems.map(p => (
          <div key={p.id} className="card" style={{ marginBottom: 8, borderLeft: `2.5px solid ${active.color}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: active.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 800, color: active.color }}>
                {(p.name || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 1 }}>{p.name || '(bez naziva)'}</div>
                {p.company && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.company}</div>}
                {p.value && <div style={{ fontSize: 13, fontWeight: 700, color: active.color, marginTop: 3 }}>€{parseFloat(p.value).toLocaleString()}</div>}
                {p.notes && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.5 }}>{p.notes}</div>}
              </div>
              <button type="button" onClick={() => setEditing(p)} style={{ background: 'none', border: 'none', color: 'var(--text-dimmer)', cursor: 'pointer', padding: 4 }}>
                <PencilSimple size={15} />
              </button>
            </div>

            {/* Move buttons */}
            <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
              {STAGES.filter(s => s.id !== p.stage).map(s => (
                <button key={s.id} type="button" onClick={() => moveStage(p.id, s.id)} style={{
                  padding: '4px 9px', borderRadius: 6, fontFamily: 'inherit', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  background: s.color + '12', border: `0.5px solid ${s.color}40`, color: s.color,
                }}>→ {s.label}</button>
              ))}
              <button type="button" onClick={() => del(p.id)} style={{ marginLeft: 'auto', padding: '4px 9px', borderRadius: 6, fontFamily: 'inherit', fontSize: 10, cursor: 'pointer', background: 'transparent', border: '0.5px solid var(--card-border)', color: 'var(--text-dimmer)' }}>
                {t.delete_btn}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
