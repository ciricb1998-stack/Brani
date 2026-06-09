import { useApp } from '../App.jsx'
import { loadBDLClients, loadBDLMeetings, loadBDLProjects } from '../utils/storage.js'
import BrandSwitcher from '../components/BrandSwitcher.jsx'
import { Phone, Play, House, FileText, Users, Pulse, CalendarBlank, ChatCircle, Envelope } from '@phosphor-icons/react'

const MEETING_TYPE = {
  call:   { label: 'Call',    color: '#3b82f6', icon: <Phone weight="fill" size={14} /> },
  video:  { label: 'Video',   color: '#a855f7', icon: <Play weight="fill" size={14} /> },
  onsite: { label: 'Onsite',  color: '#22c55e', icon: <House weight="fill" size={14} /> },
  other:  { label: 'Anderes', color: '#f59e0b', icon: <FileText size={14} /> },
}

function StatBlock({ value, label, sub, color = 'var(--accent)', icon, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card)', border: '0.5px solid var(--card-border)',
        borderRadius: 14, padding: '16px 14px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', gap: 6,
        transition: 'all 0.15s', position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 60, height: 60,
        background: `${color}08`, borderRadius: '0 14px 0 60px',
      }} />
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>{sub}</div>}
    </div>
  )
}

export default function BDLDashboardScreen() {
  const { setScreen, t } = useApp()
  const clients  = loadBDLClients()
  const meetings = loadBDLMeetings()
  const projects = loadBDLProjects()

  const today         = new Date().toISOString().split('T')[0]
  const activeClients = clients.filter(c => c.status === 'active')
  const prospects     = clients.filter(c => c.status === 'prospect')
  const monthlyRev    = activeClients.reduce((s, c) => s + (Number(c.monthlyValue) || 0), 0)
  const activeProjects = projects.filter(p => p.status === 'active')
  const openOffers    = projects.filter(p => p.status === 'offer')
  const pipelineVal   = openOffers.reduce((s, p) => s + (Number(p.value) || 0), 0)
  const upcomingMeet  = meetings.filter(m => !m.done && m.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)
  const yearlyTarget  = 60000
  const yearlyPct     = Math.min(100, Math.round((monthlyRev * 12 / yearlyTarget) * 100))

  return (
    <div className="screen fade-in">

      {/* Header */}
      <div className="screen-header">
        <div>
          <div className="screen-title">BDL</div>
          <div className="screen-sub">Brani Digitale Lösungen</div>
        </div>
        <BrandSwitcher />
      </div>

      {/* Hero revenue card */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        border: '0.5px solid rgba(99,102,241,0.3)',
        borderRadius: 18, padding: '22px 20px', marginBottom: 10,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative glow */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: 20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(37,99,235,0.1)', filter: 'blur(20px)' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(165,180,252,0.7)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>{t.monthly_revenue}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>
              {monthlyRev.toLocaleString('de-DE')}€
            </div>
            <div style={{ fontSize: 13, color: 'rgba(165,180,252,0.6)', marginBottom: 6 }}>{t.per_month}</div>
          </div>

          {/* Yearly progress */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: 'rgba(165,180,252,0.6)' }}>{t.yearly_target} {yearlyTarget.toLocaleString('de-DE')}€</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#a5b4fc' }}>{yearlyPct}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${yearlyPct}%`, background: 'linear-gradient(90deg, #6366f1, #a5b4fc)', borderRadius: 2, transition: 'width 0.6s ease' }} />
            </div>
          </div>

          {/* Pipeline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 11, color: 'rgba(165,180,252,0.7)' }}>{t.pipeline_label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>{pipelineVal.toLocaleString('de-DE')}€</span>
            <span style={{ fontSize: 10, color: 'rgba(165,180,252,0.4)', marginLeft: 2 }}>({openOffers.length} {t.offers_label})</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
        <StatBlock
          value={activeClients.length}
          label={t.clients_label}
          sub={`${prospects.length} ${t.prospects_label}`}
          color="#3b82f6"
          onClick={() => setScreen('bdl_clients')}
          icon={<Users weight="fill" size={16} />}
        />
        <StatBlock
          value={activeProjects.length}
          label={t.projects_label}
          sub={`${projects.length} ${t.total_label2}`}
          color="#a855f7"
          onClick={() => setScreen('bdl_projects')}
          icon={<Pulse weight="fill" size={16} />}
        />
        <StatBlock
          value={upcomingMeet.length}
          label={t.meetings_label}
          sub={t.upcoming_label}
          color="#22c55e"
          onClick={() => setScreen('bdl_meetings')}
          icon={<CalendarBlank weight="fill" size={16} />}
        />
      </div>

      {/* Upcoming meetings */}
      <div className="section-title" style={{ marginTop: 14 }}>{t.upcoming_meetings}</div>
      {upcomingMeet.length === 0 ? (
        <div style={{ background: 'var(--card)', border: '0.5px solid var(--card-border)', borderRadius: 14, padding: '20px', textAlign: 'center', color: 'var(--text-dimmer)', fontSize: 13 }}>
          {t.no_meetings}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {upcomingMeet.map(m => {
            const t = MEETING_TYPE[m.type] || MEETING_TYPE.other
            return (
              <div key={m.id} onClick={() => setScreen('bdl_meetings')}
                style={{
                  background: 'var(--card)', border: '0.5px solid var(--card-border)',
                  borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s',
                }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: `${t.color}15`, border: `1px solid ${t.color}30`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: t.color,
                }}>
                  {t.icon}
                  <div style={{ fontSize: 8, fontWeight: 700, marginTop: 2, letterSpacing: '0.3px' }}>{t.label.toUpperCase()}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{m.clientName}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.color }}>
                    {new Date(m.date + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </div>
                  {m.time && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{m.time}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Prospects */}
      {prospects.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 14 }}>Prospects</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {prospects.slice(0, 3).map(c => (
              <div key={c.id} onClick={() => setScreen('bdl_clients')}
                style={{
                  background: 'var(--card)', border: '0.5px solid var(--card-border)',
                  borderRadius: 14, padding: '12px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
                }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent-dim), rgba(37,99,235,0.1))',
                  border: '1px solid var(--accent-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 800, color: 'var(--accent)',
                }}>
                  {(c.name || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{c.practice || c.city}</div>
                </div>
                <div style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.5px' }}>PROSPECT</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Quick actions */}
      <div className="section-title" style={{ marginTop: 14 }}>{t.quick_access}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        {[
          { label: t.new_client, sub: 'CRM', screen: 'bdl_clients', color: '#3b82f6',
            icon: <Users weight="fill" size={18} /> },
          { label: t.new_meeting, sub: t.meetings_label, screen: 'bdl_meetings', color: '#22c55e',
            icon: <ChatCircle weight="fill" size={18} /> },
          { label: t.new_project, sub: 'Pipeline', screen: 'bdl_projects', color: '#a855f7',
            icon: <Pulse weight="fill" size={18} /> },
          { label: 'E-Envelope', sub: t.email_templates, screen: 'bdl_email', color: '#f59e0b',
            icon: <Envelope weight="fill" size={18} /> },
        ].map(a => (
          <button key={a.label} onClick={() => setScreen(a.screen)}
            style={{
              background: 'var(--card)', border: `0.5px solid ${a.color}25`,
              borderRadius: 14, padding: '14px 14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
            }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${a.color}15`, border: `1px solid ${a.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, flexShrink: 0 }}>
              {a.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>{a.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
