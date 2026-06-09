import { useState } from 'react'
import { useApp } from '../App.jsx'
import { loadDayData, loadWeekData, loadAIKey } from '../utils/storage.js'
import { Brain } from '@phosphor-icons/react'

// ── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ data, maxVal = 3 }) {
  const W = 300, H = 70, gap = 1.5
  const barW = W / data.length - gap
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 64, display: 'block' }}>
      {data.map((val, i) => {
        const barH = val > 0 ? Math.max(4, (val / maxVal) * (H - 4)) : 2
        const x = i * (W / data.length)
        const y = H - barH
        const fill = val === maxVal ? 'var(--green)' : val > 0 ? 'var(--accent)' : 'var(--chart-empty)'
        return <rect key={i} x={x + 0.5} y={y} width={barW} height={barH} rx={2} fill={fill} />
      })}
    </svg>
  )
}

// ── Line Chart ────────────────────────────────────────────────────────────────
function LineChart({ data, maxVal = 10, color = 'var(--accent)' }) {
  const W = 300, H = 64, PAD = 6
  const hasData = data.some(v => v !== '' && v !== null && !isNaN(Number(v)) && Number(v) > 0)
  if (!hasData) return (
    <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-dimmer)' }}>
      —
    </div>
  )
  const pts = data.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * W,
    y: (v !== '' && v !== null && Number(v) > 0)
      ? H - PAD - ((Number(v) / maxVal) * (H - PAD * 2))
      : null
  }))
  const validPts = pts.filter(p => p.y !== null)
  // Build path segments (skip nulls)
  const segments = []
  let cur = []
  pts.forEach(p => {
    if (p.y !== null) cur.push(p)
    else { if (cur.length >= 2) segments.push(cur); cur = [] }
  })
  if (cur.length >= 2) segments.push(cur)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 64, display: 'block' }}>
      {[0.25, 0.5, 0.75].map(pct => (
        <line key={pct} x1={0} y1={H - PAD - pct * (H - PAD * 2)} x2={W} y2={H - PAD - pct * (H - PAD * 2)}
          style={{ stroke: 'var(--chart-grid)' }} />
      ))}
      {segments.map((seg, si) => (
        <polyline key={si}
          points={seg.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
          fill="none" stroke={color}
          strokeLinecap="round" strokeLinejoin="round"
        />
      ))}
      {validPts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} />
      ))}
    </svg>
  )
}

// ── Yearly Grid ───────────────────────────────────────────────────────────────
function YearGrid({ year }) {
  const today = new Date()
  const jan1 = new Date(year, 0, 1)
  const jan1Day = jan1.getDay() === 0 ? 6 : jan1.getDay() - 1 // Mon=0
  const totalWeeks = 53
  const months = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec']

  const weeks = []
  for (let w = 0; w < totalWeeks; w++) {
    const days = []
    for (let d = 0; d < 7; d++) {
      const dayNum = w * 7 + d - jan1Day
      const date = new Date(year, 0, 1 + dayNum)
      const isCurrentYear = date.getFullYear() === year
      const isFuture = date > today
      if (!isCurrentYear) { days.push({ key: `${w}-${d}`, empty: true }); continue }
      const data = loadDayData(date)
      const tasks = [data.task1Done, data.task2Done, data.task3Done].filter(Boolean).length
      days.push({
        key: `${w}-${d}`, tasks, isFuture,
        isToday: date.toDateString() === today.toDateString(),
        label: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
      })
    }
    weeks.push(days)
  }

  // Month label positions (approximate)
  const monthLabels = months.map((m, mi) => {
    const d = new Date(year, mi, 1)
    const dayOfYear = Math.floor((d - jan1) / 86400000)
    const weekNum = Math.floor((dayOfYear + jan1Day) / 7)
    return { m, weekNum }
  })

  return (
    <div>
      <div className="year-grid-wrap">
        <div className="year-grid">
          {weeks.map((weekDays, wi) => (
            <div key={wi} className="year-week">
              {weekDays.map(cell => {
                if (cell.empty) return <div key={cell.key} className="year-cell" style={{ background: 'transparent' }} />
                if (cell.isFuture) return <div key={cell.key} className="year-cell" style={{ background: 'var(--year-future)' }} />
                const intensity = cell.tasks === 3 ? 1 : cell.tasks === 2 ? 0.65 : cell.tasks === 1 ? 0.35 : 0
                return (
                  <div
                    key={cell.key}
                    className="year-cell"
                    title={`${cell.label} — ${cell.tasks}/3`}
                    style={{
                      background: intensity > 0 ? `rgba(34,197,94,${intensity})` : 'var(--year-empty)',
                      border: cell.isToday ? '1.5px solid var(--accent)' : 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
        {/* Month labels */}
        <div style={{ position: 'relative', height: 14, marginTop: 3 }}>
          {monthLabels.map(({ m, weekNum }) => (
            <span key={m} style={{
              position: 'absolute',
              left: weekNum * 12,
              fontSize: 8,
              color: 'var(--text-dimmer)',
              fontWeight: 500
            }}>{m}</span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>0</span>
        {[[0,'var(--year-empty)'], [0.35,'rgba(34,197,94,0.35)'], [0.65,'rgba(34,197,94,0.65)'], [1,'rgba(34,197,94,1)']].map(([op, bg]) => (
          <div key={op} style={{ width: 10, height: 10, borderRadius: 2, background: bg }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>3/3</span>
      </div>
    </div>
  )
}

// ── Local smart insights ──────────────────────────────────────────────────────
function localInsights(days30) {
  const active = days30.filter(d => d.tasks > 0).length
  const workouts = days30.filter(d => d.data.workout).length
  const meds = days30.filter(d => d.data.meditation).length
  const sleepVals = days30.map(d => Number(d.data.sleep)).filter(v => v > 0)
  const energyVals = days30.map(d => Number(d.data.energy)).filter(v => v > 0)
  const avgSleep = sleepVals.length ? (sleepVals.reduce((a,b)=>a+b,0)/sleepVals.length).toFixed(1) : null
  const avgEnergy = energyVals.length ? (energyVals.reduce((a,b)=>a+b,0)/energyVals.length).toFixed(1) : null
  let streak = 0
  for (let i = 0; i < days30.length; i++) { if (days30[i].tasks > 0) streak++; else break }

  const lines = []
  if (active >= 25) lines.push(`✅ Konzistentnost: ${active}/30 aktivnih dana — top tier. Ovo je tvoj kompetitivni advantage.`)
  else if (active >= 15) lines.push(`⚡ Konzistentnost: ${active}/30 dana. Postoji prostor za poboljšanje — pazi na dane kada padaš.`)
  else lines.push(`⚠️ Samo ${active}/30 aktivnih dana. Konzistentnost je tvoj glavni problem. Sistem > motivacija.`)

  if (workouts >= 20) lines.push(`💪 ${workouts} treninga za 30 dana — odlično za oporavak.`)
  else if (workouts < 10) lines.push(`🦵 Samo ${workouts} treninga. Trening mora biti nepovrediv za povratak na teren.`)

  if (avgSleep) {
    if (Number(avgSleep) < 7) lines.push(`😴 Prosječan san: ${avgSleep}h — prenizak. San = oporavak. Cilj: 8h.`)
    else lines.push(`😴 San: ${avgSleep}h — dobro. Tijelo se oporavlja tokom sna.`)
  }

  if (avgEnergy) {
    if (Number(avgEnergy) < 5) lines.push(`🔋 Energija: ${avgEnergy}/10 — zabrinjavajuće nisko. Provjeri san, ishranu, hidrataciju.`)
    else if (Number(avgEnergy) >= 7) lines.push(`🔋 Energija: ${avgEnergy}/10 — odlično. Tijelo radi kako treba.`)
  }

  if (meds >= 20) lines.push(`🧘 Meditacija ${meds}/30 dana — disciplina uma je jaka.`)
  if (streak >= 7) lines.push(`🔥 Streak: ${streak} dana zaredom. Ne prekidaj ga — momentum je najvredniji asset.`)

  lines.push(`\n📌 Sljedeći korak: Identifikuj koji dan u sedmici najčešće padaš i stavi zaštitu oko tog dana.`)
  return lines.join('\n\n')
}

// ── Claude AI insights ────────────────────────────────────────────────────────
async function fetchAIInsights(days30, lang, apiKey) {
  const active = days30.filter(d => d.tasks > 0).length
  const workouts = days30.filter(d => d.data.workout).length
  const meds = days30.filter(d => d.data.meditation).length
  const sleepVals = days30.map(d => Number(d.data.sleep)).filter(v => v > 0)
  const energyVals = days30.map(d => Number(d.data.energy)).filter(v => v > 0)
  const avgSleep = sleepVals.length ? (sleepVals.reduce((a,b)=>a+b,0)/sleepVals.length).toFixed(1) : 'N/A'
  const avgEnergy = energyVals.length ? (energyVals.reduce((a,b)=>a+b,0)/energyVals.length).toFixed(1) : 'N/A'
  const totalTasks = days30.reduce((s, d) => s + d.tasks, 0)
  const langName = { bs: 'bosanski', de: 'Deutsch', en: 'English' }[lang] || 'bosanski'

  const prompt = `Ti si moj lični AI coach. Analiziraj moje podatke za zadnjih 30 dana i daj mi personalizovane uvide.

MOJI PODACI (30 dana):
- Aktivni dani: ${active}/30 (${Math.round(active/30*100)}%)
- Zadaci završeni: ${totalTasks}/90 (${Math.round(totalTasks/90*100)}%)
- Treninzi: ${workouts}/30 dana
- Meditacije: ${meds}/30 dana
- Prosječan san: ${avgSleep}h
- Prosječna energija: ${avgEnergy}/10

KO SAM JA:
Branislav Ćirić, 28 god. Bivši profesionalni fudbaler koji se oporavlja od povrede i istovremeno gradi IT/digitalizacijsku kompaniju u Njemačkoj za medicinske prakse. Radio sam sam bez tima, doselio se u Njemačku sa 25 s ničim i gradi od nule.

MOJI PILARI: Biznis (IT kompanija), Fudbal (oporavak + povratak), Zdravlje, Lični rast & disciplina.

Daj mi:
1. ANALIZA — šta vidim u ovim brojevima? Što radi, što ne radi? Budi konkretan.
2. TOP 3 AKCIJE — specifične za moju situaciju za sljedeću sedmicu. Bez generalnih savjeta.
3. PITANJE — jedno moćno pitanje za duboku refleksiju.

Odgovori na ${langName}. Budi direktan, bez uvoda i zaključaka.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API greška ${res.status}`)
  }
  const json = await res.json()
  return json.content[0].text
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const { settings, t } = useApp()
  const today = new Date()
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const hasApiKey = !!loadAIKey()

  // Last 30 days
  const days30 = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const data = loadDayData(d)
    const tasks = [data.task1Done, data.task2Done, data.task3Done].filter(Boolean).length
    days30.push({ date: d, data, tasks })
  }

  // Last 14 days
  const days14 = days30.slice(16)

  // Weekly scores (last 8)
  const weekScores = []
  for (let w = 7; w >= 0; w--) {
    const d = new Date(today); d.setDate(d.getDate() - w * 7)
    const wData = loadWeekData(d)
    weekScores.push(wData.score ? Number(wData.score) : null)
  }

  // Summary stats
  const active = days30.filter(d => d.tasks > 0).length
  const workouts = days30.filter(d => d.data.workout).length
  const meds = days30.filter(d => d.data.meditation).length
  const totalTasks = days30.reduce((s, d) => s + d.tasks, 0)
  const sleepVals = days30.map(d => Number(d.data.sleep)).filter(v => v > 0)
  const energyVals = days30.map(d => Number(d.data.energy)).filter(v => v > 0)
  const avgSleep = sleepVals.length ? (sleepVals.reduce((a,b)=>a+b,0)/sleepVals.length).toFixed(1) : '--'
  const avgEnergy = energyVals.length ? (energyVals.reduce((a,b)=>a+b,0)/energyVals.length).toFixed(1) : '--'
  const consistency = Math.round(active / 30 * 100)

  async function handleAI() {
    setAiLoading(true); setAiError(''); setAiText('')
    try {
      const apiKey = loadAIKey()
      if (apiKey) {
        const text = await fetchAIInsights(days30, settings.lang, apiKey)
        setAiText(text)
      } else {
        await new Promise(r => setTimeout(r, 700))
        setAiText(localInsights(days30))
      }
    } catch (e) { setAiError('Greška: ' + e.message) }
    setAiLoading(false)
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">STATISTIKEN</div>
          <div className="screen-title">{t.statistics}</div>
          <div className="screen-sub">{t.your_progress}</div>
        </div>
        <span className="badge badge-accent">{t.days_30}</span>
      </div>

      {/* Summary stats */}
      <div className="stat-bar">
        <div className="stat-card">
          <div className="stat-label">{t.active_days_label}</div>
          <div className="stat-value">{active}</div>
          <div className="stat-sub">{t.of_30}</div>
          <div className="progress-bar"><div className="progress-fill green" style={{ width: `${consistency}%` }} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.tasks_label}</div>
          <div className="stat-value">{totalTasks}</div>
          <div className="stat-sub">/ 90 max</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.round(totalTasks/90*100)}%` }} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.consistency_stat}</div>
          <div className="stat-value" style={{ color: consistency >= 80 ? 'var(--green)' : consistency >= 50 ? 'var(--amber)' : 'var(--red)' }}>
            {consistency}%
          </div>
          <div className="stat-sub">ratio</div>
        </div>
      </div>

      <div className="stat-bar" style={{ marginTop: 8 }}>
        <div className="stat-card">
          <div className="stat-label">{t.workouts}</div>
          <div className="stat-value">{workouts}</div>
          <div className="stat-sub">{t.sessions_label}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.avg_sleep}</div>
          <div className="stat-value">{avgSleep}</div>
          <div className="stat-sub">{t.hours_label}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.avg_energy}</div>
          <div className="stat-value">{avgEnergy}</div>
          <div className="stat-sub">/ 10</div>
        </div>
      </div>

      {/* Task completion bar chart */}
      <div className="section-title">{t.tasks_30d}</div>
      <div className="card slide-up">
        <div className="card-glow" />
        <BarChart data={days30.map(d => d.tasks)} maxVal={3} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-dimmer)', marginTop: 4 }}>
          <span>30 dana</span>
          <span>danas</span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {[['var(--green)','3/3'],['var(--accent)','1-2'],['var(--chart-empty)','0']].map(([c,l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sleep chart */}
      <div className="section-title">{t.sleep_14d}</div>
      <div className="card slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="card-glow" />
        <LineChart data={days14.map(d => d.data.sleep || null)} maxVal={12} color="var(--blue)" />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-dimmer)', marginTop: 4 }}>
          <span>{t.days_14_ago}</span>
          <span style={{ color: 'var(--blue)' }}>{t.target_sleep}</span>
          <span>{t.today}</span>
        </div>
      </div>

      {/* Energy chart */}
      <div className="section-title">{t.energy_14d}</div>
      <div className="card slide-up" style={{ animationDelay: '0.08s' }}>
        <div className="card-glow" />
        <LineChart data={days14.map(d => d.data.energy || null)} maxVal={10} color="var(--amber)" />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-dimmer)', marginTop: 4 }}>
          <span>{t.days_14_ago}</span>
          <span style={{ color: 'var(--amber)' }}>{t.scale_1_10}</span>
          <span>{t.today}</span>
        </div>
      </div>

      {/* Weekly score */}
      <div className="section-title">{t.weekly_scores}</div>
      <div className="card slide-up" style={{ animationDelay: '0.11s' }}>
        <div className="card-glow" />
        <LineChart data={weekScores} maxVal={10} color="var(--purple)" />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-dimmer)', marginTop: 4 }}>
          <span>-8 {t.weeks_ago}</span>
          <span style={{ color: 'var(--purple)' }}>{t.self_assessment}</span>
          <span>{t.this_week}</span>
        </div>
      </div>

      {/* Yearly grid */}
      <div className="section-title">{t.activity_grid} — {today.getFullYear()}</div>
      <div className="card slide-up" style={{ animationDelay: '0.14s' }}>
        <div className="card-glow" />
        <YearGrid year={today.getFullYear()} />
      </div>

      {/* AI Coach */}
      <div className="section-title">{t.ai_coach}</div>
      <div className="card slide-up" style={{ animationDelay: '0.18s' }}>
        <div className="card-glow" style={{ background: 'var(--purple-dim)' }} />
        <div className="card-header">
          <div className="card-icon" style={{ background: 'var(--purple-dim)' }}>
            <Brain weight="fill" size={18} style={{ color: 'var(--purple)' }} />
          </div>
          <div>
            <div className="card-title" style={{ color: 'var(--purple)' }}>
              {hasApiKey ? 'Claude AI Coach' : t.smart_analysis}
            </div>
            <div className="card-sub">
              {hasApiKey ? t.powered_claude : t.local_analysis_sub}
            </div>
          </div>
        </div>

        {!aiText && !aiError && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.6 }}>
            {t.personalized_insights}
          </div>
        )}

        {aiText && <div className="ai-insight-text">{aiText}</div>}

        {aiError && (
          <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12, padding: '8px 10px', background: 'var(--red-dim)', borderRadius: 6 }}>
            {aiError}
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ background: aiLoading ? 'var(--purple-dim)' : 'var(--purple)', color: aiLoading ? 'var(--purple)' : 'white' }}
          onClick={handleAI}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <><span className="spin">◌</span> {t.analyzing}</>
          ) : (
            <>{aiText ? t.refresh_insight : t.generate_insight}</>
          )}
        </button>
      </div>
    </div>
  )
}
