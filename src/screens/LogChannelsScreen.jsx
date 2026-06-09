import { useState } from 'react'
import { useApp } from '../App.jsx'
import { loadLogChannels, saveLogChannels } from '../utils/storage.js'
import { PLATFORM_COLORS, PlatformIcon } from '../data/platforms.jsx'

const PLATFORMS = ['youtube', 'linkedin', 'instagram', 'tiktok']
const BLANK = { id: '', platform: 'youtube', name: '', handle: '', url: '', followers: 0, target: 1000 }

export default function LogChannelsScreen() {
  const { t } = useApp()
  const [channels, setChannels] = useState(loadLogChannels())
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)

  function save(ch) { setChannels(ch); saveLogChannels(ch) }
  function openEdit(ch) { setForm({ ...ch }); setEditing(ch.id) }
  function openAdd() { setForm({ ...BLANK, id: Math.random().toString(36).slice(2, 9) }); setEditing('new') }

  function submitForm() {
    if (!form.name) return
    if (editing === 'new') save([...channels, form])
    else save(channels.map(c => c.id === editing ? form : c))
    setEditing(null)
  }

  function deleteChannel(id) { save(channels.filter(c => c.id !== id)); setEditing(null) }

  function updateFollowers(id, val) {
    save(channels.map(c => c.id === id ? { ...c, followers: Number(val) || 0 } : c))
  }

  if (editing !== null) {
    return (
      <div className="screen fade-in">
        <div className="screen-header">
          <div><div className="screen-title">{editing === 'new' ? t.new_channel : t.edit_channel}</div></div>
        </div>

        <div className="section-title">{t.platform_label}</div>
        <div className="field-row c2">
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => setForm(f => ({ ...f, platform: p }))}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                border: `2px solid ${form.platform === p ? PLATFORM_COLORS[p] : 'var(--card-border)'}`,
                background: form.platform === p ? `${PLATFORM_COLORS[p]}18` : 'var(--card)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
              <PlatformIcon platform={p} size={32} />
              <span style={{ fontSize: 10, fontWeight: 600, color: form.platform === p ? PLATFORM_COLORS[p] : 'var(--text-dim)', letterSpacing: '0.5px' }}>
                {p.toUpperCase()}
              </span>
            </button>
          ))}
        </div>

        <div className="section-title">{t.details_label}</div>
        <div className="card">
          {[
            { label: t.channel_name, key: 'name', placeholder: 'npr. Branislav Ćirić' },
            { label: t.handle_label, key: 'handle', placeholder: '@branislavciric' },
            { label: t.channel_url, key: 'url', placeholder: 'https://youtube.com/@...' },
          ].map(f => (
            <div key={f.key} className="field" style={{ marginBottom: 10 }}>
              <label className="field-label">{f.label}</label>
              <input className="field-input" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
            </div>
          ))}
          <div className="field-row c2">
            <div className="field">
              <label className="field-label">{t.current_followers}</label>
              <input className="field-input" type="number" value={form.followers} onChange={e => setForm(p => ({ ...p, followers: Number(e.target.value) || 0 }))} />
            </div>
            <div className="field">
              <label className="field-label">{t.goal_label}</label>
              <input className="field-input" type="number" value={form.target} onChange={e => setForm(p => ({ ...p, target: Number(e.target.value) || 0 }))} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {editing !== 'new' && (
            <button className="btn btn-outline" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => deleteChannel(editing)}>{t.delete_label}</button>
          )}
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
          <div className="screen-title">{t.channels_title}</div>
          <div className="screen-sub">{t.your_platforms}</div>
        </div>
      </div>

      {channels.map(ch => {
        const color = PLATFORM_COLORS[ch.platform] || '#666'
        const pct = ch.target > 0 ? Math.min(100, Math.round((ch.followers / ch.target) * 100)) : 0
        return (
          <div key={ch.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <PlatformIcon platform={ch.platform} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{ch.name || ch.platform}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dimmer)' }}>{ch.handle}</div>
              </div>
              <button onClick={() => openEdit(ch)} style={{ background: 'none', border: '0.5px solid var(--card-border)', borderRadius: 7, color: 'var(--text-dim)', cursor: 'pointer', fontSize: 11, padding: '4px 10px', fontFamily: 'inherit' }}>{t.edit_btn}</button>
            </div>

            {/* Followers input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <input
                className="field-input"
                type="number"
                value={ch.followers}
                onChange={e => updateFollowers(ch.id, e.target.value)}
                style={{ width: 110, flexShrink: 0 }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>/ {ch.target?.toLocaleString()} {t.goal_label}</div>
            </div>

            {/* Progress bar */}
            <div style={{ background: 'var(--card-border)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{ch.followers?.toLocaleString()} {t.followers_label}</span>
              <span style={{ fontSize: 11, color, fontWeight: 700 }}>{pct}%</span>
            </div>

            {ch.url && (
              <button onClick={() => window.open(ch.url, '_blank')} className="btn btn-outline" style={{ marginTop: 10, width: '100%', fontSize: 12 }}>
                {t.open_channel}
              </button>
            )}
          </div>
        )
      })}

      <button className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} onClick={openAdd}>
        {t.add_channel}
      </button>
    </div>
  )
}
