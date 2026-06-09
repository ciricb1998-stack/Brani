import { useState } from 'react'
import { useApp } from '../App.jsx'
import { loadLogChannels, saveLogChannels, loadLogStatSnaps, saveLogStatSnaps } from '../utils/storage.js'

const PLATFORM_COLORS = { youtube: '#FF0000', linkedin: '#0077B5', instagram: '#E1306C', tiktok: '#fe2c55' }

export default function LogStatsScreen() {
  const { t } = useApp()
  const [channels, setChannels] = useState(loadLogChannels())
  const [snaps, setSnaps] = useState(loadLogStatSnaps())
  const [showSnapshot, setShowSnapshot] = useState(false)
  const [snapForm, setSnapForm] = useState({})

  function saveSnap() {
    const today = new Date().toISOString().split('T')[0]
    const newSnaps = [...snaps]
    channels.forEach(ch => {
      if (snapForm[ch.id] !== undefined) {
        newSnaps.push({ id: Math.random().toString(36).slice(2, 9), date: today, platform: ch.platform, channelId: ch.id, channelName: ch.name, followers: Number(snapForm[ch.id]) || 0 })
        // also update channel followers
      }
    })
    const updatedChannels = channels.map(ch => snapForm[ch.id] !== undefined ? { ...ch, followers: Number(snapForm[ch.id]) || ch.followers } : ch)
    setSnaps(newSnaps); saveLogStatSnaps(newSnaps)
    setChannels(updatedChannels); saveLogChannels(updatedChannels)
    setShowSnapshot(false); setSnapForm({})
  }

  // Get last 4 snaps per channel for mini chart
  function getChannelHistory(channelId) {
    return snaps.filter(s => s.channelId === channelId).sort((a, b) => a.date.localeCompare(b.date)).slice(-6)
  }

  function getGrowth(channelId) {
    const history = getChannelHistory(channelId)
    if (history.length < 2) return null
    const last = history[history.length - 1].followers
    const prev = history[history.length - 2].followers
    return last - prev
  }

  const totalFollowers = channels.reduce((s, c) => s + (c.followers || 0), 0)
  const totalTarget = channels.reduce((s, c) => s + (c.target || 0), 0)

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-title">{t.log_stats_title}</div>
          <div className="screen-sub">{t.followers_growth}</div>
        </div>
      </div>

      {/* Total */}
      <div className="card" style={{ textAlign: 'center', padding: '20px 16px', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '1px', marginBottom: 6 }}>{t.total_label}</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent)' }}>{totalFollowers.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dimmer)' }}>{t.goal_label}: {totalTarget.toLocaleString()}</div>
        <div style={{ background: 'var(--card-border)', borderRadius: 4, height: 6, margin: '10px 0 0', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, (totalFollowers / totalTarget) * 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 4 }} />
        </div>
      </div>

      {/* Per channel */}
      {channels.map(ch => {
        const history = getChannelHistory(ch.id)
        const growth = getGrowth(ch.id)
        const pct = ch.target > 0 ? Math.min(100, Math.round((ch.followers / ch.target) * 100)) : 0
        const color = PLATFORM_COLORS[ch.platform]
        const maxVal = history.length > 0 ? Math.max(...history.map(s => s.followers)) : 1

        return (
          <div key={ch.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{ch.name || ch.platform}</div>
              {growth !== null && (
                <div style={{ fontSize: 12, fontWeight: 700, color: growth >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {growth >= 0 ? '+' : ''}{growth}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color }}>{(ch.followers || 0).toLocaleString()}</span>
              <span style={{ fontSize: 12, color: 'var(--text-dim)', alignSelf: 'flex-end' }}>/{ch.target?.toLocaleString()}</span>
            </div>

            <div style={{ background: 'var(--card-border)', borderRadius: 4, height: 4, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
            </div>

            {/* Mini bar chart */}
            {history.length > 1 && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 40, marginTop: 8 }}>
                {history.map((s, i) => (
                  <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: '100%', background: i === history.length - 1 ? color : `${color}44`, borderRadius: '3px 3px 0 0', height: `${maxVal > 0 ? (s.followers / maxVal) * 32 : 4}px`, minHeight: 4 }} />
                    <div style={{ fontSize: 8, color: 'var(--text-dimmer)' }}>{s.date.slice(5)}</div>
                  </div>
                ))}
              </div>
            )}

            {history.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-dimmer)', textAlign: 'center', padding: '8px 0' }}>{t.no_snapshot}</div>
            )}
          </div>
        )
      })}

      {/* Snapshot */}
      {showSnapshot && (
        <div className="card" style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>{t.snapshot_record}</div>
          {channels.map(ch => (
            <div key={ch.id} className="field-row c2" style={{ marginBottom: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{ch.name || ch.platform}</div>
              <input className="field-input" type="number" placeholder={ch.followers?.toString()} value={snapForm[ch.id] ?? ''} onChange={e => setSnapForm(f => ({ ...f, [ch.id]: e.target.value }))} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowSnapshot(false)}>{t.snapshot_cancel}</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveSnap}>{t.snapshot_save}</button>
          </div>
        </div>
      )}

      <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowSnapshot(true)}>
        {t.snapshot_btn}
      </button>

      {snaps.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="section-title">{t.history_label}</div>
          {[...snaps].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15).map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid var(--card-border)', fontSize: 12 }}>
              <span style={{ color: 'var(--text-dim)' }}>{s.date} · {s.channelName || s.platform}</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{s.followers?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
