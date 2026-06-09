import { useApp } from '../App.jsx'
import {
  IconHome, IconPlanner, IconReview, IconGoals, IconRecovery, IconCapture,
  IconCalendar, IconStats, IconVocab, IconTraining, IconFootball, IconUser,
  IconDashboard, IconChannels, IconPipeline, IconFinance, IconClients,
  IconMeetings, IconProjects, IconEmail, IconComposer, IconInvoice, IconDocuments,
  IconBrain, IconTrophy, IconDT, IconHilfe,
} from './Icons.jsx'

const BRAND_META = {
  brani:  { label: 'BRANI', sub: 'Personal Brand',    color: '#F97316' },
  log:    { label: 'LOG',   sub: 'Ledger of Growth',  color: '#A855F7' },
  branip: { label: 'BDL',  sub: 'Digitale Lösungen',  color: '#2563EB' },
}

const SWITCH_BRANDS = [
  { id: 'brani',  label: 'BRANI', home: 'home',     color: '#F97316' },
  { id: 'log',    label: 'LOG',   home: 'log_home',  color: '#A855F7' },
  { id: 'branip', label: 'BDL',   home: 'bdl_home',  color: '#2563EB' },
]

export default function SidebarNav({ active, onChange }) {
  const { settings, updateSettings, setScreen, t } = useApp()
  const brand = BRAND_META[settings.brand] || BRAND_META.brani
  const accentColor = brand.color

  const items = {
    brani: [
      { id: 'home',          label: t?.nav_dashboard || 'Dashboard',    Icon: IconHome },
      { id: 'planner',       label: t?.nav_planner || 'Planer',         Icon: IconPlanner },
      { id: 'weekly_review', label: t?.nav_weekly_review || 'Weekly',   Icon: IconReview },
      { id: 'goals',         label: t?.nav_goals || 'Ciljevi',          Icon: IconGoals },
      { id: 'recovery',      label: t?.nav_recovery || 'Recovery',      Icon: IconRecovery },
      { id: 'capture',       label: t?.nav_capture || 'Capture',        Icon: IconCapture },
      { id: 'calendar',      label: t?.calendar || 'Kalendar',          Icon: IconCalendar },
      { id: 'stats',         label: t?.statistics || 'Statistike',      Icon: IconStats },
      { id: 'vocab',         label: t?.nav_vocab || 'Vocab',            Icon: IconVocab },
      { id: 'training_plan', label: 'Trainingsplan',                    Icon: IconTraining },
      { id: 'football',      label: 'Football',                         Icon: IconTrophy },
      { id: 'settings',      label: t?.profile || 'Profil',             Icon: IconUser },
    ],
    log: [
      { id: 'log_home',     label: t?.nav_dashboard || 'Dashboard',     Icon: IconDashboard },
      { id: 'log_channels', label: t?.nav_channels || 'Kanali',         Icon: IconChannels },
      { id: 'log_calendar', label: t?.nav_content || 'Sadržaj',         Icon: IconCalendar },
      { id: 'log_stats',    label: t?.nav_stats || 'Stats',             Icon: IconStats },
    ],
    branip: [
      { id: 'bdl_home',      label: t?.nav_dashboard || 'Dashboard',      Icon: IconDashboard },
      { id: 'bdl_pipeline',  label: t?.nav_pipeline || 'Pipeline',        Icon: IconPipeline },
      { id: 'bdl_finance',   label: t?.nav_finance || 'Finansije',        Icon: IconFinance },
      { id: 'bdl_clients',   label: t?.nav_clients || 'Klijenti',         Icon: IconClients },
      { id: 'bdl_meetings',  label: t?.nav_meetings || 'Meetings',        Icon: IconMeetings },
      { id: 'bdl_projects',  label: t?.nav_projects || 'Projekti',        Icon: IconProjects },
      { id: 'bdl_email',     label: t?.nav_email_templates || 'Email',    Icon: IconEmail },
      { id: 'bdl_composer',  label: t?.nav_email_composer || 'AI Composer', Icon: IconComposer },
      { id: 'bdl_invoice',   label: 'Rechnungen',                          Icon: IconInvoice },
      { id: 'bdl_documents', label: 'Dokumente',                           Icon: IconDocuments },
      { id: 'dt_gmbh',       label: 'DT GmbH',                             Icon: IconDT        },
      { id: 'hilfe',         label: 'Hilfe',                               Icon: IconHilfe     },
      { id: 'settings',      label: t?.profile || 'Profil',                Icon: IconUser },
    ],
  }[settings.brand] || []

  function switchBrand(b) {
    if (settings.brand === b.id) return
    updateSettings({ brand: b.id })
    setScreen(b.home)
    onChange(b.home)
  }

  return (
    <nav className="sidebar-nav">
      {/* Logo */}
      <div className="sidebar-logo">
        <img
          src="/icon-192.png"
          alt="BRANI"
          style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, objectFit: 'cover' }}
        />
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', letterSpacing: '1px' }}>{brand.label}</div>
          <div style={{ fontSize: 9, color: 'var(--text-dimmer)', letterSpacing: '0.5px' }}>{brand.sub}</div>
        </div>
      </div>

      {/* Nav items */}
      <div className="sidebar-section"><span>{t?.nav_section_nav || 'NAVIGACIJA'}</span></div>
      {items.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            className={`sidebar-btn${isActive ? ' active' : ''}`}
            onClick={() => onChange(id)}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isActive ? `${accentColor}14` : 'transparent',
              border: `1px solid ${isActive ? accentColor + '30' : 'transparent'}`,
              transition: 'all 0.2s',
            }}>
              <Icon size={15} color={isActive ? accentColor : 'var(--text-dimmer)'} />
            </div>
            {label}
          </button>
        )
      })}

      {/* AI Coach */}
      <div className="sidebar-section" style={{ marginTop: 12 }}><span>{t?.nav_section_ai || 'AI COACH'}</span></div>
      <button
        className={`sidebar-ai-btn${active === 'ai' ? ' active' : ''}`}
        onClick={() => onChange('ai')}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: active === 'ai' ? 'rgba(168,85,247,0.16)' : 'transparent',
          border: `1px solid ${active === 'ai' ? 'rgba(168,85,247,0.3)' : 'transparent'}`,
          transition: 'all 0.2s',
        }}>
          <IconBrain size={15} color={active === 'ai' ? '#A855F7' : 'var(--text-dimmer)'} />
        </div>
        {t?.nav_ai_label || 'BRANI Mentor'}
      </button>

      {/* Brand switcher */}
      <div className="sidebar-footer">
        <div style={{ fontSize: 9, color: 'var(--text-dimmer)', letterSpacing: '1.5px', marginBottom: 10, fontWeight: 600 }}>
          {t?.nav_section_brand || 'PROMIJENI BRAND'}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {SWITCH_BRANDS.map(b => (
            <button
              key={b.id}
              onClick={() => switchBrand(b)}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 7,
                border: `1px solid ${settings.brand === b.id ? b.color + '60' : 'var(--card-border)'}`,
                background: settings.brand === b.id ? `${b.color}18` : 'var(--card)',
                color: settings.brand === b.id ? b.color : 'var(--text-dimmer)',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.8px',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
              }}
            >{b.label}</button>
          ))}
        </div>
      </div>
    </nav>
  )
}
