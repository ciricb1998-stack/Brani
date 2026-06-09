import { useState } from 'react'
import { useApp } from '../App.jsx'
import { loadLogContent, saveLogContent } from '../utils/storage.js'

const PLATFORMS = ['youtube', 'linkedin', 'instagram', 'tiktok']
const TYPES = ['video', 'post', 'reel', 'story', 'article', 'carousel']
const STATUSES = ['idea', 'draft', 'scheduled', 'published']
const STATUS_COLORS = { published: 'var(--green)', scheduled: 'var(--accent)', draft: 'var(--text-dim)', idea: 'var(--text-dimmer)' }
const PLATFORM_COLORS = { youtube: '#FF0000', linkedin: '#0077B5', instagram: '#E1306C', tiktok: '#fe2c55' }
const BLANK = { platform: 'youtube', type: 'video', title: '', status: 'idea', date: new Date().toISOString().split('T')[0], notes: '', url: '' }

export default function LogCalendarScreen() {
  const { t } = useApp()

  const STATUS_LABELS = { idea: t.status_idea, draft: t.status_draft, scheduled: t.status_scheduled, published: t.status_published }
  const TYPE_LABELS = { video: t.type_video, post: t.type_post, reel: t.type_reel, story: t.type_story, article: t.type_article, carousel: t.type_carousel }
  const [content, setContent] = useState(loadLogContent())
  const [filter, setFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)

  function save(items) { setContent(items); saveLogContent(items) }

  function openAdd() { setForm({ ...BLANK, id: Math.random().toString(36).slice(2, 9), date: new Date().toISOString().split('T')[0] }); setEditing('new') }
  function openEdit(c) { setForm({ ...c }); setEditing(c.id) }

  function submitForm() {
    if (!form.title) return
    if (editing === 'new') save([...content, form])
    else save(content.map(c => c.id === editing ? form : c))
    setEditing(null)
  }

  function deleteItem(id) { save(content.filter(c => c.id !== id)) }

  function toggleStatus(id) {
    const order = ['idea', 'draft', 'scheduled', 'published']
    save(content.map(c => {
      if (c.id !== id) return c
      const next = order[(order.indexOf(c.status) + 1) % order.length]
      return { ...c, status: next }
    }))
  }

  const filtered = content
    .filter(c => filter === 'all' || c.platform === filter)
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .sort((a, b) => b.date.localeCompare(a.date))

  if (editing !== null) {
    return (
      <div className="screen fade-in">
        <div className="screen-header">
          <div><div className="screen-title">{editing === 'new' ? t.new_content_title : t.edit_content_title}</div></div>
        </div>

        <div className="card">
          <div className="field" style={{ marginBottom: 10 }}>
            <label className="field-label">{t.title_label}</label>
            <input className="field-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t.title_placeholder} />
          </div>

          <div className="field-row c2" style={{ marginBottom: 10 }}>
            <div className="field">
              <label className="field-label">{t.platform_sel}</label>
              <select className="field-input" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">{t.type_sel}</label>
              <select className="field-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(tp => <option key={tp} value={tp}>{TYPE_LABELS[tp]}</option>)}
              </select>
            </div>
          </div>

          <div className="field-row c2" style={{ marginBottom: 10 }}>
            <div className="field">
              <label className="field-label">{t.date_label}</label>
              <input className="field-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="field">
              <label className="field-label">{t.status_label}</label>
              <select className="field-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 10 }}>
            <label className="field-label">{t.notes_ideas}</label>
            <textarea className="field-input" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t.notes_placeholder} style={{ resize: 'none' }} />
          </div>

          <div className="field">
            <label className="field-label">{t.url_label}</label>
            <input className="field-input" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {editing !== 'new' && <button className="btn btn-outline" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => { deleteItem(editing); setEditing(null) }}>{t.delete_label}</button>}
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
          <div className="screen-title">{t.content_title}</div>
          <div className="screen-sub">{t.content_calendar}</div>
        </div>
      </div>

      {/* Platform filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
        {['all', ...PLATFORMS].map(p => (
          <button key={p} onClick={() => setFilter(p)}
            style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 100, border: `1px solid ${filter === p ? PLATFORM_COLORS[p] || 'var(--accent)' : 'var(--card-border)'}`, background: filter === p ? `${PLATFORM_COLORS[p] || 'var(--accent)'}18` : 'transparent', color: filter === p ? PLATFORM_COLORS[p] || 'var(--accent)' : 'var(--text-dim)', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            {p === 'all' ? t.filter_all : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 100, border: `1px solid ${statusFilter === s ? STATUS_COLORS[s] || 'var(--accent)' : 'var(--card-border)'}`, background: statusFilter === s ? `${STATUS_COLORS[s]}18` : 'transparent', color: statusFilter === s ? STATUS_COLORS[s] || 'var(--text)' : 'var(--text-dimmer)', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
            {s === 'all' ? t.filter_all_status : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dimmer)', fontSize: 13 }}>{t.no_content}</div>
      ) : (
        filtered.map(c => (
          <div key={c.id} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: PLATFORM_COLORS[c.platform], flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => openEdit(c)}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{c.platform} · {TYPE_LABELS[c.type] || c.type} · {c.date}</div>
            </div>
            <button onClick={() => toggleStatus(c.id)}
              style={{ flexShrink: 0, padding: '3px 8px', borderRadius: 6, border: `1px solid ${STATUS_COLORS[c.status]}`, background: 'transparent', color: STATUS_COLORS[c.status], fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {STATUS_LABELS[c.status]}
            </button>
          </div>
        ))
      )}

      <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={openAdd}>
        {t.add_new_content}
      </button>
    </div>
  )
}
