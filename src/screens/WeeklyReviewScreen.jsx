import { useState } from 'react'
import { useApp } from '../App.jsx'
import { loadWeeklyReview, saveWeeklyReview } from '../utils/storage.js'
import { Check, FloppyDisk } from '@phosphor-icons/react'

function getISOWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const w1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7)
}

function getMaxWeek(year) {
  return getISOWeek(new Date(year, 11, 28))
}

function getWeekBounds(year, week) {
  const jan4 = new Date(year, 0, 4)
  const dow = (jan4.getDay() + 6) % 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - dow + (week - 1) * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { monday, sunday }
}

const fmt = d => d.toLocaleDateString('bs-BA', { day: 'numeric', month: 'short' })

export default function WeeklyReviewScreen() {
  const { t } = useApp()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [week, setWeek] = useState(getISOWeek(today))
  const [data, setData] = useState(() => loadWeeklyReview(today.getFullYear(), getISOWeek(today)))
  const [saved, setSaved] = useState(false)

  function navigate(dir) {
    let w = week + dir
    let y = year
    if (w < 1) { y--; w = getMaxWeek(y) }
    else if (w > getMaxWeek(y)) { y++; w = 1 }
    setYear(y); setWeek(w)
    setData(loadWeeklyReview(y, w))
    setSaved(false)
  }

  function set(k, v) { setData(p => ({ ...p, [k]: v })) }

  function doSave() {
    saveWeeklyReview(year, week, data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const { monday, sunday } = getWeekBounds(year, week)
  const isCurrentWeek = week === getISOWeek(today) && year === today.getFullYear()

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">WEEKLY REVIEW</div>
          <div className="screen-title">{t.weekly_review_title}</div>
          <div className="screen-sub">{isCurrentWeek ? t.current_week : t.week_review}</div>
        </div>
      </div>

      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <button type="button" onClick={() => navigate(-1)} style={{ background: 'var(--card)', border: '0.5px solid var(--card-border)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-dim)', fontFamily: 'inherit' }}>‹</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>W{String(week).padStart(2,'0')} · {fmt(monday)} – {fmt(sunday)}</div>
          {isCurrentWeek && <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>{t.current_label}</div>}
        </div>
        <button type="button" onClick={() => navigate(1)} style={{ background: 'var(--card)', border: '0.5px solid var(--card-border)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-dim)', fontFamily: 'inherit' }}>›</button>
      </div>

      {/* Score */}
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-glow" />
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{t.week_score}</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(v => {
            const color = v >= 8 ? '#22c55e' : v >= 5 ? '#f59e0b' : '#ef4444'
            return (
              <button key={v} type="button" onClick={() => set('score', v)} style={{
                width: 38, height: 38, borderRadius: 10, fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                background: data.score === v ? color + '25' : 'transparent',
                border: `0.5px solid ${data.score === v ? color : 'var(--card-border)'}`,
                color: data.score === v ? color : 'var(--text-dimmer)',
                transition: 'all 0.15s',
              }}>{v}</button>
            )
          })}
        </div>
        {data.score && (
          <div style={{ marginTop: 8, fontSize: 12, color: data.score >= 8 ? '#22c55e' : data.score >= 5 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>
            {data.score >= 8 ? t.score_excellent : data.score >= 5 ? t.score_solid : t.score_hard}
          </div>
        )}
      </div>

      {/* Retrospektiva */}
      <div className="section-title" style={{ textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: 10 }}>{t.retrospective}</div>
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-glow" />
        {[
          ['wins',       t.wins_question,   t.wins_placeholder],
          ['challenges', t.challenges_question, t.challenges_placeholder],
          ['lessons',    t.lessons_question, t.lessons_placeholder],
        ].map(([key, label, placeholder]) => (
          <div key={key} className="field">
            <label className="field-label">{label}</label>
            <textarea className="field-textarea" style={{ height: 70 }} value={data[key] || ''} onChange={e => set(key, e.target.value)} placeholder={placeholder} />
          </div>
        ))}
      </div>

      {/* Plan */}
      <div className="section-title" style={{ textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: 10 }}>{t.next_week_plan}</div>
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-glow" />
        <div className="field">
          <label className="field-label">{t.week_theme}</label>
          <input className="field-input" value={data.theme || ''} onChange={e => set('theme', e.target.value)} placeholder={t.week_theme_placeholder} />
        </div>

        {[1,2,3].map(i => (
          <div key={i} className="field">
            <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--accent-dim)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--accent)' }}>{i}</span>
              {t.priority_label} {i}
            </label>
            <input className="field-input" value={data[`p${i}`] || ''} onChange={e => set(`p${i}`, e.target.value)} placeholder={`${t.priority_placeholder} ${i}...`} />
          </div>
        ))}

        <div className="field">
          <label className="field-label">{t.intention_label}</label>
          <textarea className="field-textarea" style={{ height: 70 }} value={data.intention || ''} onChange={e => set('intention', e.target.value)} placeholder={t.intention_placeholder} />
        </div>
      </div>

      <button className="btn btn-primary" onClick={doSave} style={{ width: '100%', background: saved ? 'var(--green)' : 'var(--accent)' }}>
        {saved
          ? <><Check size={15} /> {t.saved_review}</>
          : <><FloppyDisk weight="fill" size={15} /> {t.save_review}</>
        }
      </button>
    </div>
  )
}
