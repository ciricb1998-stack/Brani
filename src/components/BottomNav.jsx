import { useState } from 'react'
import { useApp } from '../App.jsx'
import {
  IconHome, IconPlanner, IconGoals, IconBrain, IconMore,
  IconStats, IconCalendar, IconReview, IconRecovery, IconTraining,
  IconCapture, IconVocab, IconUser, IconSettings,
  IconChannels, IconDashboard,
  IconPipeline, IconFinance, IconClients, IconMeetings,
  IconProjects, IconEmail, IconInvoice, IconDocuments, IconComposer,
  IconFootball, IconAlarm, IconDT, IconHilfe,
} from './Icons.jsx'

const AI_TAB = { id: 'ai', isCenter: true }
const MORE_TAB = { id: '__more__', isMore: true }

function MoreSheet({ items, active, onNavigate, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.7)', animation: 'fadeIn 0.15s ease both',
      }} />
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 901,
        background: 'var(--bg2, #0f0f0f)',
        borderTop: '1px solid var(--card-border)',
        borderRadius: '16px 16px 0 0',
        padding: '16px 16px calc(env(safe-area-inset-bottom) + 16px)',
        animation: 'slideUp 0.25s ease both',
      }}>
        <div style={{ width: 32, height: 3, borderRadius: 2, background: 'var(--card-border)', margin: '0 auto 20px' }} />
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dimmer)', letterSpacing: '1.5px', marginBottom: 14, textTransform: 'uppercase' }}>
          MEHR
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {items.map(({ id, label, Icon, color }) => {
            const isActive = active === id
            return (
              <button key={id} onClick={() => { onNavigate(id); onClose() }} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '14px 8px',
                background: isActive ? `${color}10` : 'var(--card)',
                border: `1px solid ${isActive ? color + '40' : 'var(--card-border)'}`,
                borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: isActive ? `${color}18` : 'var(--card2, #161616)',
                  border: `1px solid ${isActive ? color + '30' : 'var(--card-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isActive ? color : 'var(--text-dimmer)',
                }}>
                  <Icon size={20} color={isActive ? color : 'var(--text-dimmer)'} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2px', textAlign: 'center', lineHeight: 1.3, color: isActive ? color : 'var(--text-dimmer)' }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default function BottomNav({ active, onChange }) {
  const { settings, t } = useApp()
  const [showMore, setShowMore] = useState(false)

  const tabs = {
    brani: [
      { id: 'home',    label: t?.nav_home || 'Home',     Icon: IconHome },
      { id: 'planner', label: t?.nav_planner || 'Planer', Icon: IconPlanner },
      AI_TAB,
      { id: 'goals',   label: t?.nav_goals || 'Ciljevi', Icon: IconGoals },
      MORE_TAB,
    ],
    log: [
      { id: 'log_home',     label: 'Home',    Icon: IconDashboard },
      { id: 'log_channels', label: 'Kanali',  Icon: IconChannels },
      AI_TAB,
      { id: 'log_calendar', label: 'Sadržaj', Icon: IconCalendar },
      { id: 'log_stats',    label: 'Stats',   Icon: IconStats },
    ],
    branip: [
      { id: 'bdl_home',     label: 'Home',    Icon: IconDashboard },
      { id: 'bdl_pipeline', label: 'Pipeline', Icon: IconPipeline },
      AI_TAB,
      { id: 'bdl_finance',  label: 'Finance',  Icon: IconFinance },
      MORE_TAB,
    ],
  }[settings.brand] || []

  const moreItems = {
    brani: [
      { id: 'vocab',         label: 'Vocab',      Icon: IconVocab    },
      { id: 'capture',       label: 'Capture',    Icon: IconCapture  },
      { id: 'weekly_review', label: 'Weekly',     Icon: IconReview   },
      { id: 'recovery',      label: 'Recovery',   Icon: IconRecovery },
      { id: 'training_plan', label: 'Training',   Icon: IconTraining },
      { id: 'football',      label: 'Football',   Icon: IconFootball },
      { id: 'alarm',         label: 'Wecker',     Icon: IconAlarm    },
      { id: 'calendar',      label: 'Kalender',   Icon: IconCalendar },
      { id: 'stats',         label: 'Statistiken',Icon: IconStats    },
      { id: 'settings',      label: 'Profil',     Icon: IconUser     },
    ],
    branip: [
      { id: 'bdl_clients',   label: 'Klijenti',   Icon: IconClients,   color: '#2563EB' },
      { id: 'bdl_meetings',  label: 'Meetings',   Icon: IconMeetings,  color: '#2563EB' },
      { id: 'bdl_projects',  label: 'Projekte',   Icon: IconProjects,  color: '#2563EB' },
      { id: 'bdl_email',     label: 'Email',      Icon: IconEmail,     color: '#2563EB' },
      { id: 'bdl_invoice',   label: 'Rechnungen', Icon: IconInvoice,   color: '#2563EB' },
      { id: 'bdl_documents', label: 'Dokumente',  Icon: IconDocuments, color: '#2563EB' },
      { id: 'dt_gmbh',       label: 'DT GmbH',    Icon: IconDT,        color: '#F97316' },
      { id: 'hilfe',         label: 'Hilfe',      Icon: IconHilfe,     color: '#F97316' },
      { id: 'settings',      label: 'Profil',     Icon: IconUser,      color: '#2563EB' },
    ],
    log: [],
  }[settings.brand] || []

  const isMoreActive = moreItems.some(i => i.id === active)
  const accentColor = { brani: '#F97316', branip: '#2563EB', log: '#A855F7' }[settings.brand] || '#F97316'

  return (
    <>
      {showMore && (
        <MoreSheet items={moreItems} active={active} onNavigate={onChange} onClose={() => setShowMore(false)} />
      )}
      <nav className="bottom-nav">
        <div className="nav-inner">
          {tabs.map(tab => {
            if (tab.isMore) {
              const isOn = isMoreActive || showMore
              return (
                <button key="__more__" type="button" className="nav-btn" onClick={() => setShowMore(s => !s)} style={{ position: 'relative' }}>
                  {isMoreActive && !showMore && <div className="nav-dot" style={{ opacity: 1, background: accentColor }} />}
                  <div className="nav-icon" style={{ background: isOn ? `${accentColor}14` : 'transparent' }}>
                    <IconMore size={20} color={isOn ? accentColor : 'var(--text-dimmer)'} />
                  </div>
                  <span className="nav-label" style={{ color: isOn ? accentColor : 'var(--text-dimmer)', fontWeight: isOn ? 700 : 500 }}>
                    {t?.nav_more || 'Mehr'}
                  </span>
                </button>
              )
            }

            if (tab.isCenter) {
              const isActive = active === 'ai'
              return (
                <button key="ai" className="nav-btn" onClick={() => { setShowMore(false); onChange('ai') }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: isActive ? '#A855F7' : 'var(--card)',
                    border: `1px solid ${isActive ? '#A855F7' : 'var(--card-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', top: -8, transition: 'all 0.2s', flexShrink: 0,
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(168,85,247,0.5))' : 'none',
                  }}>
                    <IconBrain size={20} color={isActive ? '#fff' : '#A855F7'} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, color: isActive ? '#A855F7' : 'var(--text-dimmer)', letterSpacing: '0.2px', marginTop: -2 }}>
                    {t?.nav_ai || 'AI'}
                  </span>
                </button>
              )
            }

            const { Icon } = tab
            const isActive = active === tab.id
            return (
              <button key={tab.id} type="button" className="nav-btn" onClick={() => { setShowMore(false); onChange(tab.id) }} style={{ position: 'relative' }}>
                <div className="nav-dot" style={{ opacity: isActive ? 1 : 0, background: accentColor }} />
                <div className="nav-icon" style={{ background: isActive ? `${accentColor}14` : 'transparent' }}>
                  <Icon size={20} color={isActive ? accentColor : 'var(--text-dimmer)'} />
                </div>
                <span className="nav-label" style={{ color: isActive ? accentColor : 'var(--text-dimmer)', fontWeight: isActive ? 700 : 500 }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
