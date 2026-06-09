import { useState } from 'react'
import { useApp } from '../App.jsx'
import { BRANDS } from '../data/brands.js'
import {
  saveYearlyGoal, saveQuarterlyGoal,
  saveMonthlyGoals, saveFootballProfile, saveData
} from '../utils/storage.js'
import { Heart, Target, Star, CalendarBlank, CheckSquare, Pulse, Lightbulb, Package, Sun, ClipboardText, Briefcase, Globe } from '@phosphor-icons/react'

const TOTAL_STEPS = 7
const TODAY = new Date()
const YEAR = TODAY.getFullYear()
const MONTH = TODAY.getMonth() + 1
const CURRENT_Q = Math.ceil(MONTH / 3)
const Q_RANGES = { 1: 'Jan–Mar', 2: 'Apr–Jun', 3: 'Jul–Sep', 4: 'Okt–Dec' }
const MONTH_NAMES = ['Januar','Februar','Mart','April','Maj','Juni','Juli','Avgust','Septembar','Oktobar','Novembar','Decembar']

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ step }) {
  const { t } = useApp()
  return (
    <div style={{ padding: '0 20px', marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-dimmer)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          {t.step_label} {step} {t.step_of} {TOTAL_STEPS}
        </span>
        <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
          {Math.round((step / TOTAL_STEPS) * 100)}%
        </span>
      </div>
      <div style={{ height: 3, background: 'var(--card-border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${(step / TOTAL_STEPS) * 100}%`,
          background: 'var(--accent)',
          borderRadius: 2,
          transition: 'width 0.4s ease'
        }} />
      </div>
    </div>
  )
}

// ── Nav buttons ───────────────────────────────────────────────────────────────
function NavRow({ onBack, onNext, nextLabel, showBack = true, nextDisabled = false }) {
  const { t } = useApp()
  const label = nextLabel ?? t.next_btn
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
      {showBack && (
        <button
          onClick={onBack}
          style={{ padding: '12px 20px', borderRadius: 10, border: '0.5px solid var(--card-border)', background: 'transparent', color: 'var(--text-dim)', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >{t.back_btn}</button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        style={{
          flex: 1, padding: '13px', borderRadius: 10, border: 'none',
          background: nextDisabled ? 'var(--card)' : 'var(--accent)',
          color: nextDisabled ? 'var(--text-dimmer)' : 'white',
          fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: nextDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s'
        }}
      >{label}</button>
    </div>
  )
}

// ── Step icon wrapper ─────────────────────────────────────────────────────────
function StepIcon({ children, color = 'var(--accent)', bgColor = 'var(--accent-dim)' }) {
  return (
    <div style={{
      width: 52, height: 52, borderRadius: 14,
      background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 16
    }}>
      <div style={{ width: 26, height: 26, color }}>{children}</div>
    </div>
  )
}

// ── STEP 1: Welcome ───────────────────────────────────────────────────────────
function Step1({ data, setData, onNext }) {
  const { t } = useApp()
  const BRAND_COLORS = { branip: '#2563EB', brani: '#3B82F6', log: '#A855F7' }

  return (
    <div className="fade-in" style={{ padding: '0 20px' }}>
      <StepIcon>
        <Heart weight="fill" size={26} />
      </StepIcon>

      <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 8, lineHeight: 1.2 }}>
        {t.welcome_title}<br />
        <span style={{ color: 'var(--accent)' }}>BRANI SYSTEM</span>
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 24 }}>
        {t.setup_minutes} {YEAR}. {t.setup_minutes2}
      </p>

      <div className="field">
        <label className="field-label">{t.your_name}</label>
        <input
          className="field-input"
          placeholder="Branislav..."
          value={data.name || ''}
          onChange={e => setData(p => ({ ...p, name: e.target.value }))}
          style={{ fontSize: 16 }}
        />
      </div>

      <div className="section-title" style={{ marginTop: 20 }}>{t.choose_brand}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.values(BRANDS).map(b => (
          <div
            key={b.id}
            onClick={() => setData(p => ({ ...p, brand: b.id }))}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              background: data.brand === b.id ? 'var(--accent-dim)' : 'var(--card)',
              border: `0.5px solid ${data.brand === b.id ? 'var(--accent)' : 'var(--card-border)'}`,
              borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: BRAND_COLORS[b.id], flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{b.fullName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{b.tagline}</div>
            </div>
            {data.brand === b.id && (
              <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, color: 'white', fontWeight: 700 }}>✓</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <NavRow showBack={false} onNext={onNext} nextLabel={t.start_btn} />
    </div>
  )
}

// ── STEP 2: Godišnja vizija ───────────────────────────────────────────────────
function Step2({ data, setData, onNext, onBack }) {
  const { t } = useApp()
  return (
    <div className="fade-in" style={{ padding: '0 20px' }}>
      <StepIcon>
        <Target weight="fill" size={26} />
      </StepIcon>

      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
        {t.yearly_vision_step} {YEAR}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 20 }}>
        {t.yearly_vision_desc} {YEAR}{t.yearly_vision_desc2}
      </p>

      <div className="field">
        <label className="field-label">{t.vision}</label>
        <textarea
          className="field-textarea"
          style={{ height: 110, fontSize: 14, lineHeight: 1.6 }}
          value={data.vision || ''}
          onChange={e => setData(p => ({ ...p, vision: e.target.value }))}
          placeholder={`${t.vision_placeholder_pre} ${YEAR}. ${t.vision_placeholder_suf}`}
        />
      </div>

      <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--accent-dim)', borderRadius: 10, borderLeft: '2px solid var(--accent)' }}>
        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Lightbulb weight="fill" size={12} />
          {t.tip_label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          {t.tip_text}
        </div>
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!data.vision?.trim()} />
    </div>
  )
}

// ── STEP 3: Životni pilari ────────────────────────────────────────────────────
function Step3({ data, setData, onNext, onBack }) {
  const { t } = useApp()
  const PILLAR_SVG = {
    business: <Briefcase weight="fill" size={13} />,
    football: <Globe weight="fill" size={13} />,
    health:   <Heart weight="fill" size={13} />,
    personal: <Star weight="fill" size={13} />,
  }

  const pillars = [
    { key: 'business', label: 'Biznis & Karijera', placeholder: 'Prihod, klijenti, projekti, rast...' },
    { key: 'football', label: 'Fudbal & Sport', placeholder: 'Povratak, forma, nivo, ciljevi...' },
    { key: 'health', label: 'Zdravlje & Fitness', placeholder: 'Težina, trening, ishrana, navike...' },
    { key: 'personal', label: 'Lični rast', placeholder: 'Knjige, vještine, odnosi, mir...' },
  ]

  const allFilled = pillars.every(p => data[p.key]?.trim())

  return (
    <div className="fade-in" style={{ padding: '0 20px' }}>
      <StepIcon>
        <Star weight="fill" size={26} />
      </StepIcon>

      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
        {t.life_pillars_step} {YEAR}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 20 }}>
        {t.life_pillars_desc}
      </p>

      {pillars.map(({ key, label, placeholder }) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--accent)' }}>{PILLAR_SVG[key]}</span> {label}
          </label>
          <input
            className="field-input"
            value={data[key] || ''}
            onChange={e => setData(p => ({ ...p, [key]: e.target.value }))}
            placeholder={placeholder}
          />
        </div>
      ))}

      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!allFilled} />
    </div>
  )
}

// ── STEP 4: Kvartalni cilj ────────────────────────────────────────────────────
function Step4({ data, setData, onNext, onBack }) {
  const { t } = useApp()
  return (
    <div className="fade-in" style={{ padding: '0 20px' }}>
      <StepIcon>
        <CalendarBlank weight="fill" size={26} />
      </StepIcon>

      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
        Q{CURRENT_Q} — {Q_RANGES[CURRENT_Q]} {YEAR}
      </h2>
      <div style={{ display: 'inline-block', background: 'var(--accent-dim)', borderRadius: 100, padding: '3px 12px', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{t.quarterly_goal_step}</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 20 }}>
        {t.quarterly_desc}
      </p>

      <div className="field">
        <label className="field-label">{t.main_quarterly_goal}</label>
        <textarea
          className="field-textarea"
          style={{ height: 100, fontSize: 14, lineHeight: 1.6 }}
          value={data.quarterGoal || ''}
          onChange={e => setData(p => ({ ...p, quarterGoal: e.target.value }))}
          placeholder={`${t.quarterly_placeholder_pre} ${Q_RANGES[CURRENT_Q]} ${t.quarterly_placeholder_suf}`}
        />
      </div>

      <div className="field">
        <label className="field-label">{t.success_metric}</label>
        <input
          className="field-input"
          value={data.quarterMetric || ''}
          onChange={e => setData(p => ({ ...p, quarterMetric: e.target.value }))}
          placeholder={t.success_metric_placeholder}
        />
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!data.quarterGoal?.trim()} />
    </div>
  )
}

// ── STEP 5: Ciljevi ovog mjeseca ──────────────────────────────────────────────
function Step5({ data, setData, onNext, onBack }) {
  const { t } = useApp()
  const goals = data.monthlyGoals || []

  function addGoal() {
    if (goals.length >= 7) return
    setData(p => ({ ...p, monthlyGoals: [...goals, { id: Date.now().toString(), text: '', done: false }] }))
  }

  function updateGoal(id, text) {
    setData(p => ({ ...p, monthlyGoals: goals.map(g => g.id === id ? { ...g, text } : g) }))
  }

  function removeGoal(id) {
    setData(p => ({ ...p, monthlyGoals: goals.filter(g => g.id !== id) }))
  }

  const hasGoals = goals.some(g => g.text.trim())

  return (
    <div className="fade-in" style={{ padding: '0 20px' }}>
      <StepIcon>
        <CheckSquare size={26} />
      </StepIcon>

      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
        {MONTH_NAMES[MONTH - 1]} {YEAR}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 20 }}>
        {t.monthly_goals_step_desc}
      </p>

      {goals.map((g, i) => (
        <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--accent)'
          }}>{i + 1}</div>
          <input
            className="field-input"
            style={{ flex: 1, margin: 0 }}
            value={g.text}
            onChange={e => updateGoal(g.id, e.target.value)}
            placeholder={`Cilj ${i + 1}...`}
            autoFocus={i === goals.length - 1}
          />
          <button
            onClick={() => removeGoal(g.id)}
            style={{ background: 'none', border: 'none', color: 'var(--text-dimmer)', fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
          >×</button>
        </div>
      ))}

      <button
        onClick={addGoal}
        disabled={goals.length >= 7}
        style={{
          width: '100%', padding: '10px', marginTop: 6,
          background: 'var(--card)', border: '0.5px dashed var(--card-border)',
          borderRadius: 10, color: 'var(--text-dim)', fontFamily: 'inherit',
          fontSize: 13, cursor: goals.length >= 7 ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s'
        }}
      >{t.add_goal_count_btn} {goals.length > 0 ? `(${goals.length}/7)` : ''}</button>

      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!hasGoals} />
    </div>
  )
}

// ── STEP 6: Fudbal (optional) ─────────────────────────────────────────────────
const PHASES = ['Oporavak', 'Rehabilitacija', 'Trening', 'Puna aktivnost']

function Step6({ data, setData, onNext, onBack }) {
  const { t } = useApp()
  const fp = data.footballProfile || {}
  function setFp(patch) { setData(p => ({ ...p, footballProfile: { ...(p.footballProfile || {}), ...patch } })) }

  return (
    <div className="fade-in" style={{ padding: '0 20px' }}>
      <StepIcon bgColor="var(--red-dim)" color="var(--red)">
        <Pulse weight="fill" size={26} />
      </StepIcon>

      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
        {t.football_recovery_step}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 20 }}>
        {t.football_recovery_desc}
      </p>

      <div className="field">
        <label className="field-label">{t.injury_type_label}</label>
        <input className="field-input" value={fp.injuryType || ''} onChange={e => setFp({ injuryType: e.target.value })} placeholder={t.injury_type_placeholder} />
      </div>

      <div className="field-row c2" style={{ marginBottom: 12 }}>
        <div className="field">
          <label className="field-label">{t.injury_date_label}</label>
          <input className="field-input" type="date" value={fp.injuryDate || ''} onChange={e => setFp({ injuryDate: e.target.value })} />
        </div>
        <div className="field">
          <label className="field-label">{t.return_target_label}</label>
          <input className="field-input" type="date" value={fp.targetReturn || ''} onChange={e => setFp({ targetReturn: e.target.value })} />
        </div>
      </div>

      <div className="field">
        <label className="field-label">{t.current_phase_label}</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PHASES.map(ph => (
            <button
              key={ph}
              onClick={() => setFp({ phase: ph })}
              style={{
                padding: '7px 12px', borderRadius: 8,
                background: fp.phase === ph ? 'var(--accent-dim)' : 'var(--card)',
                border: `0.5px solid ${fp.phase === ph ? 'var(--accent)' : 'var(--card-border)'}`,
                color: fp.phase === ph ? 'var(--accent)' : 'var(--text-dim)',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >{ph}</button>
          ))}
        </div>
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextLabel="Dalje →" />
    </div>
  )
}

// ── STEP 7: Done ──────────────────────────────────────────────────────────────
function Step7({ data, onFinish }) {
  const { t } = useApp()
  const b = BRANDS[data.brand] || BRANDS.brani
  const goalCount = (data.monthlyGoals || []).filter(g => g.text.trim()).length
  const pillars = ['business', 'football', 'health', 'personal'].filter(k => data[k])

  return (
    <div className="fade-in" style={{ padding: '0 20px', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent)' }}>
        <Target weight="fill" size={36} />
      </div>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
        {t.all_set}
      </h2>
      {data.name && (
        <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600, marginBottom: 16 }}>
          {t.bravo_prefix} {data.name}!
        </div>
      )}
      <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 24 }}>
        {t.system_ready}
      </p>

      {/* Summary */}
      <div style={{ background: 'var(--card)', border: '0.5px solid var(--card-border)', borderRadius: 14, padding: '16px', marginBottom: 20, textAlign: 'left' }}>
        <div style={{ fontSize: 11, color: 'var(--text-dimmer)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, fontWeight: 600 }}>
          {t.configured_label}
        </div>

        {[
          { svg: <Target weight="fill" size={16} />, label: t.yearly_vision_check, check: !!data.vision },
          { svg: <Star weight="fill" size={16} />, label: `Q${CURRENT_Q} ${t.quarterly_check}`, check: !!data.quarterGoal },
          { svg: <CheckSquare size={16} />, label: `${goalCount} ${t.goals_check_pre} ${MONTH_NAMES[MONTH-1]}`, check: goalCount > 0 },
          { svg: <Briefcase weight="fill" size={16} />, label: `${pillars.length} ${t.pillars_check}`, check: pillars.length > 0 },
          { svg: <Globe weight="fill" size={16} />, label: t.football_profile_check, check: !!data.footballProfile?.injuryType },
        ].map(({ svg, label, check }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '0.5px solid var(--card-border)' }}>
            <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>{svg}</span>
            <span style={{ flex: 1, fontSize: 13, color: check ? 'var(--text)' : 'var(--text-dimmer)' }}>{label}</span>
            <span style={{ fontSize: 14, color: check ? 'var(--green)' : 'var(--text-dimmer)' }}>{check ? '✓' : '–'}</span>
          </div>
        ))}
      </div>

      {/* Brand tagline */}
      <div style={{ fontSize: 10, color: 'var(--text-dimmer)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 20 }}>
        {b.tagline}
      </div>

      <button
        onClick={onFinish}
        style={{
          width: '100%', padding: '16px', borderRadius: 12, border: 'none',
          background: 'var(--accent)', color: 'white',
          fontFamily: 'inherit', fontSize: 16, fontWeight: 800, cursor: 'pointer',
          letterSpacing: '0.5px'
        }}
      >{t.launch_btn}</button>
    </div>
  )
}

// ── Main OnboardingScreen ─────────────────────────────────────────────────────
export default function OnboardingScreen({ onComplete }) {
  const { updateSettings, t } = useApp()
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    name: '', brand: 'brani',
    vision: '', business: '', football: '', health: '', personal: '',
    quarterGoal: '', quarterMetric: '',
    monthlyGoals: [],
    footballProfile: {}
  })

  function next() { setStep(s => Math.min(s + 1, TOTAL_STEPS)) }
  function back() { setStep(s => Math.max(s - 1, 1)) }

  function finish() {
    // FloppyDisk brand
    updateSettings({ brand: data.brand })

    // FloppyDisk yearly vision + pillars
    saveYearlyGoal(YEAR, {
      vision: data.vision,
      business: data.business,
      football: data.football,
      health: data.health,
      personal: data.personal
    })

    // FloppyDisk quarterly goal
    saveQuarterlyGoal(YEAR, CURRENT_Q, {
      text: data.quarterGoal + (data.quarterMetric ? '\n\nMjera: ' + data.quarterMetric : ''),
      done: false
    })

    // FloppyDisk monthly goals
    const goals = (data.monthlyGoals || [])
      .filter(g => g.text.trim())
      .map(g => ({ ...g, done: false }))
    saveMonthlyGoals(YEAR, MONTH, goals)

    // FloppyDisk football profile
    if (data.footballProfile?.injuryType) {
      saveFootballProfile(data.footballProfile)
    }

    // FloppyDisk user name
    if (data.name) saveData('user_name', data.name)

    // Mark onboarding as done
    saveData('onboarded', true)

    onComplete()
  }

  const steps = [Step1, Step2, Step3, Step4, Step5, Step6, Step7]
  const StepComponent = steps[step - 1]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
      zIndex: 999
    }}>
      {/* Top brand bar */}
      <div style={{
        padding: 'calc(env(safe-area-inset-top) + 16px) 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)', letterSpacing: '1px' }}>
          BRANI SYSTEM
        </div>
        {step < TOTAL_STEPS && (
          <button
            onClick={finish}
            style={{ background: 'none', border: 'none', color: 'var(--text-dimmer)', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer', padding: '4px 8px' }}
          >{t.skip_all}</button>
        )}
      </div>

      {/* Progress */}
      <div style={{ padding: '16px 0 0', flexShrink: 0 }}>
        <ProgressBar step={step} />
      </div>

      {/* Step content */}
      <div style={{ flex: 1, paddingBottom: 32 }}>
        <StepComponent
          key={step}
          data={data}
          setData={setData}
          onNext={step === TOTAL_STEPS ? finish : next}
          onBack={back}
          onFinish={finish}
        />
      </div>
    </div>
  )
}
