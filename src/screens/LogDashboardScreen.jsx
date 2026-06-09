import { useApp } from '../App.jsx'
import { loadLogChannels, loadLogContent } from '../utils/storage.js'
import BrandSwitcher from '../components/BrandSwitcher.jsx'
import { PLATFORM_COLORS, PlatformIcon } from '../data/platforms.jsx'
import { ChartBar } from '@phosphor-icons/react'

const STATUS_COLORS = { published: 'var(--green)', scheduled: 'var(--accent)', draft: 'var(--text-dim)', idea: 'var(--text-dimmer)' }

export default function LogDashboardScreen() {
  const { setScreen, t } = useApp()
  const STATUS_LABELS = { idea: t.status_idea, draft: t.status_draft, scheduled: t.status_scheduled, published: t.status_published }
  const channels = loadLogChannels()
  const content = loadLogContent()

  const today = new Date().toISOString().split('T')[0]
  const thisMonth = today.slice(0, 7)

  const publishedThisMonth = content.filter(c => c.status === 'published' && c.date?.startsWith(thisMonth))
  const scheduled = content.filter(c => c.status === 'scheduled' && c.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)
  const totalFollowers = channels.reduce((s, c) => s + (c.followers || 0), 0)

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="screen-title">LOG</div>
              <div className="screen-sub">{t.log_sub}</div>
            </div>
            <BrandSwitcher />
          </div>
        </div>
      </div>

      {/* Total followers */}
      <div className="card" style={{ textAlign: 'center', padding: '20px 16px', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '1px', marginBottom: 6 }}>{t.total_followers}</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent)' }}>{totalFollowers.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dimmer)', marginTop: 4 }}>{channels.length} {t.platforms}</div>
      </div>

      {/* Per platform mini stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {channels.map(ch => (
          <div key={ch.id} className="card" style={{ flexShrink: 0, minWidth: 90, textAlign: 'center', padding: '12px 10px', cursor: 'pointer' }} onClick={() => setScreen('log_channels')}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
              <PlatformIcon platform={ch.platform} size={30} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{(ch.followers || 0).toLocaleString()}</div>
            <div style={{ fontSize: 9, color: 'var(--text-dimmer)', letterSpacing: '0.5px' }}>{ch.name.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* This month */}
      <div className="field-row c2" style={{ marginBottom: 0 }}>
        <div className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{publishedThisMonth.length}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dimmer)', letterSpacing: '0.3px' }}>{t.published_this_month}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{scheduled.length}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dimmer)', letterSpacing: '0.3px' }}>{t.scheduled_count}</div>
        </div>
      </div>

      {/* Upcoming content */}
      {scheduled.length > 0 && (
        <>
          <div className="section-title">{t.upcoming_content}</div>
          {scheduled.map(c => (
            <div key={c.id} className="card" style={{ marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setScreen('log_calendar')}>
              <PlatformIcon platform={c.platform} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title || t.no_title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{c.type} · {c.date}</div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: STATUS_COLORS[c.status], flexShrink: 0 }}>{STATUS_LABELS[c.status]}</div>
            </div>
          ))}
        </>
      )}

      {/* Quick actions */}
      <div className="section-title">{t.quick_actions}</div>
      <div className="field-row c2">
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setScreen('log_calendar')}>{t.new_content}</button>
        <button className="btn btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => setScreen('log_stats')}>
          <ChartBar weight="fill" size={14} />
          {t.nav_stats}
        </button>
      </div>
    </div>
  )
}
