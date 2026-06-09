import { useState, useEffect, useRef } from 'react'
import { useApp } from '../App.jsx'
import {
  loadFootballProfile, saveFootballProfile,
  loadMatches, addMatch, deleteMatch, updateMatch,
  loadTrainings, addTraining, deleteTraining, updateTraining,
  calcSeasonStats,
  loadTransferTargets, saveTransferTargets, addTransferTarget, deleteTransferTarget, updateTransferTarget,
} from '../utils/footballStorage.js'
import {
  loadBodyEntries, addBodyEntry, deleteBodyEntry,
  loadInjuryLog, saveInjuryLog, addPhysioSession, deletePhysioSession,
} from '../utils/bodyStorage.js'
import { Trophy, Timer, Plus, Trash, CaretDown, CaretUp, PencilSimple, Check, X, UploadSimple, ArrowSquareOut, Fire, Shield, Lightning, ArrowsClockwise, DownloadSimple, Pulse, Heart, WarningCircle, TrendUp } from '@phosphor-icons/react'

const POSITIONS = {
  bs: ['Napadač', 'Krilni igrač', 'Vezni igrač', 'Defanzivni vezni', 'Bek', 'Centralni bek', 'Golman'],
  de: ['Stürmer', 'Flügelspieler', 'Mittelfeldspieler', 'Defensives Mittelfeld', 'Außenverteidiger', 'Innenverteidiger', 'Torwart'],
  en: ['Striker', 'Winger', 'Midfielder', 'Defensive Mid', 'Full-back', 'Centre-back', 'Goalkeeper'],
}
const TRAINING_TYPES = {
  bs: ['Timski trening', 'Individualni', 'Teretana', 'Cardio', 'Taktika', 'Video analiza', 'Rehabilitacija'],
  de: ['Mannschaftstraining', 'Individuell', 'Kraftraum', 'Cardio', 'Taktik', 'Videoanalyse', 'Rehabilitation'],
  en: ['Team training', 'Individual', 'Gym', 'Cardio', 'Tactics', 'Video analysis', 'Rehabilitation'],
}
const RATINGS = ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐']

function useCountdown(targetDate) {
  const [time, setTime] = useState(null)
  useEffect(() => {
    if (!targetDate) { setTime(null); return }
    function calc() {
      const diff = new Date(targetDate) - new Date()
      if (diff <= 0) { setTime({ done: true }); return }
      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTime({ days, hours, minutes, seconds, done: false })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [targetDate])
  return time
}

function CountdownBox({ label, value }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 6px', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', marginTop: 5, fontWeight: 600 }}>{label}</div>
    </div>
  )
}

export default function FootballScreen() {
  const { t, settings } = useApp()
  const lang = settings?.lang || 'bs'
  const positions = POSITIONS[lang] || POSITIONS.bs
  const trainingTypes = TRAINING_TYPES[lang] || TRAINING_TYPES.bs
  const resultLabel = { win: t?.football_win || 'Pobjeda', draw: t?.football_draw || 'Remi', loss: t?.football_loss || 'Poraz' }

  const [tab, setTab] = useState('overview')
  const [profile, setProfile] = useState(loadFootballProfile)
  const [matches, setMatches] = useState(loadMatches)
  const [trainings, setTrainings] = useState(loadTrainings)
  const [editProfile, setEditProfile] = useState(false)
  const [profDraft, setProfDraft] = useState(profile)
  const [showMatchForm, setShowMatchForm] = useState(false)
  const [showTrainForm, setShowTrainForm] = useState(false)
  const [expandedMatch, setExpandedMatch] = useState(null)
  const [expandedTrain, setExpandedTrain] = useState(null)
  const logoRef = useRef()
  const transferLogoRef = useRef()

  const countdown = useCountdown(profile.returnDate)
  const stats = calcSeasonStats(matches)

  const [matchForm, setMatchForm] = useState({ date: '', opponent: '', home: true, scoreUs: '', scoreThem: '', result: 'win', minutes: '', goals: '', assists: '', rating: '3', notes: '' })
  const [trainForm, setTrainForm] = useState({ date: '', type: trainingTypes[0], rating: '3', good: '', bad: '', notes: '' })
  const [fupaLoading, setFupaLoading] = useState(false)
  const [fupaError, setFupaError] = useState('')
  const [fupaMatches, setFupaMatches] = useState([])
  const [statsForm, setStatsForm] = useState(null)

  // Transfer state
  const [transfers, setTransfers] = useState(loadTransferTargets)
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState(null)
  const TRANSFER_BLANK = { club: '', league: '', country: '', contact: '', probability: 50, status: 'interest', notes: '', logo: null }
  const [transferForm, setTransferForm] = useState(TRANSFER_BLANK)
  const TRANSFER_STATUSES = {
    interest:  { label: 'Interesse',  color: '#94a3b8' },
    contact:   { label: 'Kontakt',    color: '#3b82f6' },
    talks:     { label: 'Gespräche',  color: '#f59e0b' },
    offer:     { label: 'Angebot',    color: '#a855f7' },
    signed:    { label: 'Unterschrieben', color: '#22c55e' },
    rejected:  { label: 'Abgesagt',   color: '#ef4444' },
  }
  function submitTransfer() {
    if (!transferForm.club) return
    if (editingTransfer) {
      updateTransferTarget(editingTransfer, transferForm)
    } else {
      addTransferTarget(transferForm)
    }
    setTransfers(loadTransferTargets())
    setTransferForm(TRANSFER_BLANK)
    setShowTransferForm(false)
    setEditingTransfer(null)
  }
  function removeTransfer(id) { deleteTransferTarget(id); setTransfers(loadTransferTargets()) }
  function openEditTransfer(tr) { setTransferForm({ ...tr }); setEditingTransfer(tr.id); setShowTransferForm(true) }
  function handleTransferLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setTransferForm(f => ({ ...f, logo: ev.target.result }))
    reader.readAsDataURL(file)
  }

  // Body & Recovery state
  const [bodyEntries, setBodyEntries] = useState(loadBodyEntries)
  const [injuryLog, setInjuryLog] = useState(loadInjuryLog)
  const [showBodyForm, setShowBodyForm] = useState(false)
  const [showPhysioForm, setShowPhysioForm] = useState(false)
  const [editInjury, setEditInjury] = useState(false)
  const [injuryDraft, setInjuryDraft] = useState(injuryLog)
  const today = new Date().toISOString().slice(0, 10)
  const [bodyForm, setBodyForm] = useState({ date: today, weight: '', painLevel: '0', notes: '' })
  const [physioForm, setPhysioForm] = useState({ date: today, type: 'Physiotherapie', duration: '', exercises: '', rating: '3', notes: '' })

  function submitBodyEntry() {
    if (!bodyForm.date) return
    addBodyEntry(bodyForm)
    setBodyEntries(loadBodyEntries())
    setBodyForm({ date: today, weight: '', painLevel: '0', notes: '' })
    setShowBodyForm(false)
  }
  function removeBodyEntry(id) { deleteBodyEntry(id); setBodyEntries(loadBodyEntries()) }
  function submitPhysio() {
    if (!physioForm.date) return
    addPhysioSession(physioForm)
    setInjuryLog(loadInjuryLog())
    setPhysioForm({ date: today, type: 'Physiotherapie', duration: '', exercises: '', rating: '3', notes: '' })
    setShowPhysioForm(false)
  }
  function removePhysio(id) { deletePhysioSession(id); setInjuryLog(loadInjuryLog()) }
  function saveInjury() {
    saveInjuryLog(injuryDraft)
    setInjuryLog(injuryDraft)
    setEditInjury(false)
  }

  function saveProfile() {
    saveFootballProfile(profDraft)
    setProfile(profDraft)
    setEditProfile(false)
  }

  function handleLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setProfDraft(p => ({ ...p, logo: ev.target.result }))
    reader.readAsDataURL(file)
  }

  function submitMatch() {
    if (!matchForm.opponent || !matchForm.date) return
    addMatch(matchForm)
    setMatches(loadMatches())
    setMatchForm({ date: '', opponent: '', home: true, scoreUs: '', scoreThem: '', result: 'win', minutes: '', goals: '', assists: '', rating: '3', notes: '' })
    setShowMatchForm(false)
  }

  function submitTraining() {
    if (!trainForm.date) return
    addTraining(trainForm)
    setTrainings(loadTrainings())
    setTrainForm({ date: '', type: trainingTypes[0], rating: '3', good: '', bad: '', notes: '' })
    setShowTrainForm(false)
  }

  function removeMatch(id) { deleteMatch(id); setMatches(loadMatches()) }
  function removeTrain(id) { deleteTraining(id); setTrainings(loadTrainings()) }

  async function syncFupa() {
    if (!profile.fupaUrl) { setFupaError(t?.football_fupa_no_url || 'Unesi FUPA URL u profilu kluba.'); return }
    setFupaLoading(true)
    setFupaError('')
    setFupaMatches([])
    try {
      const res = await fetch(`/api/fupa-matches?url=${encodeURIComponent(profile.fupaUrl)}`)
      const data = await res.json()
      if (!data.ok) { setFupaError(data.error || 'Greška pri dohvatanju.'); setFupaLoading(false); return }
      if (!data.matches?.length) { setFupaError(data.warning || 'Nema utakmica na ovoj FUPA stranici.'); setFupaLoading(false); return }
      setFupaMatches(data.matches)
    } catch (e) { setFupaError('Greška: ' + e.message) }
    setFupaLoading(false)
  }

  // FloppyDisk personal stats for a FUPA club match
  function saveMyStats() {
    if (!statsForm) return
    const fm = fupaMatches[statsForm.matchIdx]
    const isHome = fm.homeTeam === (profile.club || '__home__')
    const scoreUs = isHome ? fm.scoreHome : fm.scoreAway
    const scoreThem = isHome ? fm.scoreAway : fm.scoreHome
    const result = fm.scoreHome !== null
      ? (scoreUs > scoreThem ? 'win' : scoreUs < scoreThem ? 'loss' : 'draw')
      : 'draw'
    addMatch({
      date: fm.date,
      opponent: isHome ? fm.awayTeam : fm.homeTeam,
      home: isHome,
      scoreUs: scoreUs ?? '',
      scoreThem: scoreThem ?? '',
      result,
      minutes: statsForm.minutes,
      goals: statsForm.goals,
      assists: statsForm.assists,
      rating: statsForm.rating,
      notes: statsForm.notes,
      competition: fm.competition,
      fromFupa: true,
    })
    setMatches(loadMatches())
    setStatsForm(null)
  }

  // Check if a FUPA match already has personal stats saved
  const savedMatchKeys = new Set(matches.map(m => m.date + '_' + (m.opponent || '')))

  const resultColor = { win: '#22c55e', draw: '#f59e0b', loss: '#ef4444' }

  return (
    <div className="screen fade-in">
      {/* HEADER */}
      <div className="screen-header">
        <div>
          <div className="screen-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {profile.logo
              ? <img src={profile.logo} alt="club" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }} />
              : <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,var(--accent),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚽</div>
            }
            Football
          </div>
          <div className="screen-sub">{profile.club || t?.football_no_club || 'Postavi klub'} {profile.position ? `· ${profile.position}` : ''}</div>
        </div>
        <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => { setEditProfile(true); setProfDraft(profile); setTab('overview') }}>
          <PencilSimple size={13} /> {t?.football_edit_profile || 'Uredi profil'}
        </button>
      </div>

      {/* TABS */}
      <div className="set-row" style={{ marginBottom: 16 }}>
        {[['overview', `📊 ${t?.football_overview || 'Pregled'}`], ['matches', `⚽ ${t?.football_matches || 'Utakmice'}`], ['training', `🏃 ${t?.football_training || 'Treninzi'}`], ['transfer', `🔄 Transfer`], ['body', `💪 ${t?.football_body || 'Tijelo'}`]].map(([id, label]) => (
          <button key={id} className={`set-btn${tab === id ? ' on' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── PROFIL EDIT MODAL ── */}
      {editProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 480, background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: '28px 20px 40px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20, color: 'var(--text)' }}>{t?.football_club_profile || 'Profil kluba'}</div>
            {/* Logo upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div onClick={() => logoRef.current?.click()} style={{ width: 70, height: 70, borderRadius: 14, background: 'var(--card)', border: '2px dashed var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
                {profDraft.logo ? <img src={profDraft.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <UploadSimple weight="fill" size={22} style={{ color: 'var(--text-dimmer)' }} />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{t?.football_logo || 'Logo kluba'}</div>
                <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => logoRef.current?.click()}><UploadSimple weight="fill" size={12} /> {t?.football_upload || 'UploadSimple'}</button>
              </div>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
            </div>
            {[
              [t?.football_club || 'Klub', 'club', 'FK Moj Klub'],
              [t?.football_number || 'Broj dresa', 'number', '9'],
              [t?.football_contract_until || 'Ugovor do', 'contractUntil', ''],
              [t?.football_return_date || 'Datum povratka na teren', 'returnDate', ''],
              [t?.football_fupa_url || 'FUPA profil URL', 'fupaUrl', 'https://www.fupa.net/player/...'],
            ].map(([label, key, ph]) => (
              <div className="field" key={key} style={{ marginBottom: 12 }}>
                <label className="field-label">{label}</label>
                <input
                  className="field-input"
                  type={key === 'contractUntil' || key === 'returnDate' ? 'date' : 'text'}
                  value={profDraft[key] || ''}
                  placeholder={ph}
                  onChange={e => setProfDraft(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="field" style={{ marginBottom: 20 }}>
              <label className="field-label">{t?.football_position || 'Pozicija'}</label>
              <select className="field-input" value={profDraft.position || ''} onChange={e => setProfDraft(p => ({ ...p, position: e.target.value }))}>
                <option value="">—</option>
                {positions.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditProfile(false)}>{t?.football_cancel || 'Odustani'}</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={saveProfile}><Check size={14} /> {t?.football_save || 'Sačuvaj'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <>
          {/* COUNTDOWN */}
          {profile.returnDate ? (
            <div style={{ background: 'linear-gradient(135deg,var(--accent) 0%,var(--accent) 50%,var(--accent) 100%)', borderRadius: 18, padding: '24px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: -30, left: -10, width: 80, height: 80, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', fontWeight: 700, marginBottom: 6 }}>{(t?.football_return_date || 'POVRATAK NA TEREN').toUpperCase()}</div>
              {countdown?.done ? (
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{t?.football_countdown_done || '🎉 Dobrodošao nazad!'}</div>
              ) : countdown ? (
                <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <CountdownBox label={lang === 'de' ? 'TAGE' : lang === 'en' ? 'DAYS' : 'DANA'} value={countdown.days} />
                    <CountdownBox label={lang === 'de' ? 'STD' : lang === 'en' ? 'HRS' : 'SATI'} value={countdown.hours} />
                    <CountdownBox label={lang === 'de' ? 'MIN' : 'MIN'} value={countdown.minutes} />
                    <CountdownBox label={lang === 'de' ? 'SEK' : lang === 'en' ? 'SEC' : 'SEK'} value={countdown.seconds} />
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                    📅 {new Date(profile.returnDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {profile.club ? ` · ${profile.club}` : ''}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div onClick={() => { setEditProfile(true); setProfDraft(profile) }} style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent))', borderRadius: 18, padding: '22px 20px', marginBottom: 16, cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>⏱️</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Postavi datum povratka na teren</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 4 }}>{t?.football_set_return_sub || 'Tapni da uneseš datum'}</div>
            </div>
          )}

          {/* CLUB CARD */}
          {profile.club && (
            <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              {profile.logo
                ? <img src={profile.logo} style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 10 }} />
                : <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(var(--accent-rgb,249,115,22),0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⚽</div>
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{profile.club}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  {profile.position} {profile.number ? `· #${profile.number}` : ''}
                </div>
                {profile.contractUntil && (
                  <div style={{ fontSize: 11, color: 'var(--text-dimmer)', marginTop: 4 }}>
                    {t?.football_contract_until || 'Ugovor do'}: {new Date(profile.contractUntil).toLocaleDateString('de-DE')}
                  </div>
                )}
              </div>
              {profile.fupaUrl && (
                <a href={profile.fupaUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dimmer)' }}>
                  <ArrowSquareOut weight="fill" size={16} />
                </a>
              )}
            </div>
          )}

          {/* SEASON STATS */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dimmer)', letterSpacing: '1.5px', marginBottom: 10 }}>{t?.football_season_stats || 'SEZONA — STATISTIKA'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
              {[
                { icon: <Shield weight="fill" size={16} />, value: stats.games, label: t?.football_games || 'Utakmica' },
                { icon: <Timer weight="fill" size={16} />, value: stats.minutes, label: t?.football_minutes || 'Minuta' },
                { icon: '⚽', value: stats.goals, label: t?.football_goals || 'Golova' },
                { icon: <Lightning weight="fill" size={16} />, value: stats.assists, label: t?.football_assists || 'Asistencija' },
              ].map(({ icon, value, label }) => (
                <div key={label} className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
                  <div style={{ fontSize: typeof icon === 'string' ? 18 : 14, color: 'var(--accent)', marginBottom: 5, display: 'flex', justifyContent: 'center' }}>{icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-dimmer)', marginTop: 4, letterSpacing: '0.5px' }}>{label}</div>
                </div>
              ))}
            </div>
            {stats.games > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { color: '#22c55e', value: stats.wins, label: t?.football_wins || 'Pobjeda' },
                  { color: '#f59e0b', value: stats.draws, label: t?.football_draws || 'Remija' },
                  { color: '#ef4444', value: stats.losses, label: t?.football_losses || 'Poraza' },
                ].map(({ color, value, label }) => (
                  <div key={label} className="card" style={{ textAlign: 'center', padding: '10px 8px', borderColor: `${color}30` }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent matches */}
          {matches.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dimmer)', letterSpacing: '1.5px', marginBottom: 10 }}>{t?.football_recent || 'ZADNJE UTAKMICE'}</div>
              {matches.slice(0, 3).map(m => (
                <div key={m.id} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${resultColor[m.result]}18`, border: `1px solid ${resultColor[m.result]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: resultColor[m.result], flexShrink: 0 }}>
                    {m.scoreUs ?? '?'}-{m.scoreThem ?? '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{m.home ? '' : '@ '}{m.opponent}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dimmer)' }}>{m.date ? new Date(m.date).toLocaleDateString('de-DE') : ''} · {m.minutes || 0}' · ⚽{m.goals || 0} 🎯{m.assists || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── UTAKMICE ── */}
      {tab === 'matches' && (
        <>
          {/* FUPA SYNC */}
          <div className="card" style={{ marginBottom: 14, background: 'linear-gradient(135deg,rgba(var(--accent-rgb,249,115,22),0.08),rgba(var(--accent-rgb,249,115,22),0.03))', borderColor: 'rgba(var(--accent-rgb,249,115,22),0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: profile.fupaUrl ? 10 : 0 }}>
              <div style={{ fontSize: 20 }}>⚡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>FUPA Klub Sync</div>
                <div style={{ fontSize: 11, color: 'var(--text-dimmer)', wordBreak: 'break-all' }}>
                  {profile.fupaUrl ? profile.fupaUrl.replace(/https?:\/\/(?:www\.)?fupa\.net\//i, '') : 'Unesi URL kluba/tima u profilu'}
                </div>
              </div>
              <button className="btn btn-outline" style={{ fontSize: 11, borderColor: 'rgba(var(--accent-rgb,249,115,22),0.4)', color: '#22c55e', flexShrink: 0 }} onClick={syncFupa} disabled={fupaLoading}>
                <ArrowsClockwise weight="fill" size={13} style={{ animation: fupaLoading ? 'spin 0.7s linear infinite' : 'none' }} />
                {fupaLoading ? '...' : 'Sync'}
              </button>
            </div>
            {fupaError && <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 6 }}>{fupaError}</div>}

            {/* Loaded FUPA matches */}
            {fupaMatches.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: '1px', marginBottom: 10 }}>
                  {fupaMatches.length} UTAKMICA SA FUPA
                </div>
                {fupaMatches.map((m, i) => {
                  const opponent = m.awayTeam === profile.club ? m.homeTeam : m.awayTeam
                  const isHome = m.homeTeam === profile.club
                  const key = m.date + '_' + opponent
                  const alreadySaved = savedMatchKeys.has(key)
                  const score = m.scoreHome !== null ? `${m.scoreHome}-${m.scoreAway}` : null

                  return (
                    <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Score or upcoming badge */}
                        <div style={{ width: 44, height: 36, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                          background: m.upcoming ? 'rgba(100,116,139,0.1)' : score ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                          border: `1px solid ${m.upcoming ? 'rgba(100,116,139,0.2)' : 'rgba(34,197,94,0.2)'}`,
                          color: m.upcoming ? 'var(--text-dimmer)' : '#22c55e',
                        }}>
                          {score || '—'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {isHome ? '' : '@ '}{opponent || m.homeTeam + ' vs ' + m.awayTeam}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginTop: 1 }}>
                            {m.date ? new Date(m.date).toLocaleDateString('de-DE') : '—'}
                            {m.competition ? ` · ${m.competition}` : ''}
                            {m.upcoming ? ' · 🔜 Predstojeća' : ''}
                          </div>
                        </div>
                        {/* Add stats or saved badge */}
                        {alreadySaved ? (
                          <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', flexShrink: 0 }}>✓ Saved</div>
                        ) : !m.upcoming ? (
                          <button onClick={() => setStatsForm({ matchIdx: i, minutes: '', goals: '0', assists: '0', rating: '3', notes: '' })}
                            style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)', flexShrink: 0 }}>
                            + Moji stats
                          </button>
                        ) : null}
                      </div>

                      {/* Stats form for this match */}
                      {statsForm?.matchIdx === i && (
                        <div style={{ marginTop: 10, padding: '12px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--accent)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 }}>Unesi svoju statistiku</div>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            {[['Minuti', 'minutes', 90], ['Golovi', 'goals', 0], ['Asistencije', 'assists', 0]].map(([label, key, def]) => (
                              <div key={key} style={{ flex: 1 }}>
                                <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginBottom: 3 }}>{label}</div>
                                <input className="field-input" type="number" min="0" style={{ padding: '6px 8px', fontSize: 13 }}
                                  value={statsForm[key]} placeholder={String(def)}
                                  onChange={e => setStatsForm(f => ({ ...f, [key]: e.target.value }))} />
                              </div>
                            ))}
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginBottom: 4 }}>Ocjena nastupa</div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {[1,2,3,4,5].map(n => (
                                <button key={n} onClick={() => setStatsForm(f => ({ ...f, rating: String(n) }))}
                                  style={{ flex: 1, padding: '5px 2px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                                    background: statsForm.rating === String(n) ? 'var(--accent-dim)' : 'transparent',
                                    border: `1px solid ${statsForm.rating === String(n) ? 'var(--accent)' : 'var(--card-border)'}` }}>
                                  {RATINGS[n-1]}
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea className="field-input" rows={2} placeholder="Bilješka o nastupu..." value={statsForm.notes}
                            onChange={e => setStatsForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'none', marginBottom: 8, fontSize: 12 }} />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-outline" style={{ flex: 1, fontSize: 11 }} onClick={() => setStatsForm(null)}>Odustani</button>
                            <button className="btn btn-primary" style={{ flex: 2, fontSize: 11 }} onClick={saveMyStats}><Check size={12} /> Sačuvaj</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowMatchForm(v => !v)}>
              <Plus size={15} /> {showMatchForm ? (t?.football_close || 'Zatvori') : (t?.football_add_manual || 'Dodaj ručno')}
            </button>
          </div>

          {showMatchForm && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="card-glow" />
              <div className="field-row c2" style={{ marginBottom: 10 }}>
                <div className="field">
                  <label className="field-label">{t?.football_date || 'Datum'}</label>
                  <input className="field-input" type="date" value={matchForm.date} onChange={e => setMatchForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">{t?.football_opponent || 'Protivnik'}</label>
                  <input className="field-input" value={matchForm.opponent} placeholder="FK..." onChange={e => setMatchForm(f => ({ ...f, opponent: e.target.value }))} />
                </div>
              </div>
              <div className="field-row c2" style={{ marginBottom: 10 }}>
                <div className="field">
                  <label className="field-label">{t?.football_our_goal || 'Naš gol'}</label>
                  <input className="field-input" type="number" min="0" value={matchForm.scoreUs} onChange={e => setMatchForm(f => ({ ...f, scoreUs: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">{t?.football_their_goal || 'Njihov gol'}</label>
                  <input className="field-input" type="number" min="0" value={matchForm.scoreThem} onChange={e => setMatchForm(f => ({ ...f, scoreThem: e.target.value }))} />
                </div>
              </div>
              <div className="field-row c3" style={{ marginBottom: 10 }}>
                <div className="field">
                  <label className="field-label">{t?.football_minutes_played || 'Minuti'}</label>
                  <input className="field-input" type="number" min="0" max="120" value={matchForm.minutes} onChange={e => setMatchForm(f => ({ ...f, minutes: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">{t?.football_goals || 'Golovi'}</label>
                  <input className="field-input" type="number" min="0" value={matchForm.goals} onChange={e => setMatchForm(f => ({ ...f, goals: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">{t?.football_assists || 'Asistencije'}</label>
                  <input className="field-input" type="number" min="0" value={matchForm.assists} onChange={e => setMatchForm(f => ({ ...f, assists: e.target.value }))} />
                </div>
              </div>
              <div className="field-row c2" style={{ marginBottom: 10 }}>
                <div className="field">
                  <label className="field-label">{t?.football_result || 'Rezultat'}</label>
                  <select className="field-input" value={matchForm.result} onChange={e => setMatchForm(f => ({ ...f, result: e.target.value }))}>
                    <option value="win">{t?.football_win || 'Pobjeda'}</option>
                    <option value="draw">{t?.football_draw || 'Remi'}</option>
                    <option value="loss">{t?.football_loss || 'Poraz'}</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">{t?.football_rating || 'Ocjena (1-5)'}</label>
                  <select className="field-input" value={matchForm.rating} onChange={e => setMatchForm(f => ({ ...f, rating: e.target.value }))}>
                    {[1,2,3,4,5].map(n => <option key={n} value={String(n)}>{RATINGS[n-1]}</option>)}
                  </select>
                </div>
              </div>
              <div className="field" style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {[true, false].map(h => (
                    <button key={String(h)} onClick={() => setMatchForm(f => ({ ...f, home: h }))} style={{ flex: 1, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: matchForm.home === h ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${matchForm.home === h ? 'var(--accent)' : 'var(--card-border)'}`, color: matchForm.home === h ? 'var(--accent)' : 'var(--text-dim)' }}>
                      {h ? (t?.football_home || '🏠 Domaćin') : (t?.football_away || '✈️ Gost')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field" style={{ marginBottom: 14 }}>
                <label className="field-label">{t?.football_note || 'Bilješka'}</label>
                <textarea className="field-input" rows={3} value={matchForm.notes} placeholder="..." onChange={e => setMatchForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'none' }} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={submitMatch}><Check size={14} /> {t?.football_save_match || 'Sačuvaj utakmicu'}</button>
            </div>
          )}

          {matches.length === 0 && !showMatchForm && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dimmer)', fontSize: 13 }}>{t?.football_no_matches || 'Nema utakmica još. Dodaj prvu!'}</div>
          )}

          {matches.map(m => (
            <div key={m.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setExpandedMatch(expandedMatch === m.id ? null : m.id)}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${resultColor[m.result]}15`, border: `2px solid ${resultColor[m.result]}50`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: resultColor[m.result], lineHeight: 1 }}>{m.scoreUs ?? '?'}-{m.scoreThem ?? '?'}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {m.home ? '' : '@ '}{m.opponent}
                    <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: `${resultColor[m.result]}18`, color: resultColor[m.result] }}>{resultLabel[m.result]}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dimmer)', marginTop: 2 }}>
                    {m.date ? new Date(m.date).toLocaleDateString('de-DE') : ''} · {m.minutes || 0}' · ⚽{m.goals || 0} 🎯{m.assists || 0} · {RATINGS[(m.rating||3)-1]}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button onClick={e => { e.stopPropagation(); removeMatch(m.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dimmer)', padding: 4, borderRadius: 6 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dimmer)'}
                  ><Trash size={14} /></button>
                  {expandedMatch === m.id ? <CaretUp size={14} style={{ color: 'var(--text-dimmer)' }} /> : <CaretDown size={14} style={{ color: 'var(--text-dimmer)' }} />}
                </div>
              </div>
              {expandedMatch === m.id && m.notes && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--card-border)', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.notes}</div>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── TRENINZI ── */}
      {tab === 'training' && (
        <>
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 14 }} onClick={() => setShowTrainForm(v => !v)}>
            <Plus size={15} /> {showTrainForm ? (t?.football_close || 'Zatvori') : (t?.football_add_training || 'Dodaj trening')}
          </button>

          {showTrainForm && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="card-glow" />
              <div className="field-row c2" style={{ marginBottom: 10 }}>
                <div className="field">
                  <label className="field-label">{t?.football_date || 'Datum'}</label>
                  <input className="field-input" type="date" value={trainForm.date} onChange={e => setTrainForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">{t?.football_training_type || 'Tip treninga'}</label>
                  <select className="field-input" value={trainForm.type} onChange={e => setTrainForm(f => ({ ...f, type: e.target.value }))}>
                    {trainingTypes.map(tt => <option key={tt}>{tt}</option>)}
                  </select>
                </div>
              </div>
              <div className="field" style={{ marginBottom: 10 }}>
                <label className="field-label">{t?.football_training_rating || 'Ocjena treninga'}</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setTrainForm(f => ({ ...f, rating: String(n) }))} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', background: trainForm.rating === String(n) ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${trainForm.rating === String(n) ? 'var(--accent)' : 'var(--card-border)'}` }}>
                      {RATINGS[n-1]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field" style={{ marginBottom: 10 }}>
                <label className="field-label">{t?.football_what_good || '✅ Šta je dobro bilo?'}</label>
                <textarea className="field-input" rows={2} value={trainForm.good} placeholder="..." onChange={e => setTrainForm(f => ({ ...f, good: e.target.value }))} style={{ resize: 'none' }} />
              </div>
              <div className="field" style={{ marginBottom: 10 }}>
                <label className="field-label">{t?.football_what_bad || '❌ Šta treba popraviti?'}</label>
                <textarea className="field-input" rows={2} value={trainForm.bad} placeholder="..." onChange={e => setTrainForm(f => ({ ...f, bad: e.target.value }))} style={{ resize: 'none' }} />
              </div>
              <div className="field" style={{ marginBottom: 14 }}>
                <label className="field-label">{t?.football_note || 'Bilješka'}</label>
                <textarea className="field-input" rows={2} value={trainForm.notes} placeholder="..." onChange={e => setTrainForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'none' }} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={submitTraining}><Check size={14} /> {t?.football_save_training || 'Sačuvaj trening'}</button>
            </div>
          )}

          {trainings.length === 0 && !showTrainForm && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dimmer)', fontSize: 13 }}>{t?.football_no_training || 'Nema treninga još. Dodaj prvi!'}</div>
          )}

          {trainings.map(tr => (
            <div key={tr.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setExpandedTrain(expandedTrain === tr.id ? null : tr.id)}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  <Fire weight="fill" size={20} style={{ color: '#f97316' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{tr.type}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dimmer)', marginTop: 2 }}>
                    {tr.date ? new Date(tr.date).toLocaleDateString('de-DE') : ''} · {RATINGS[(tr.rating||3)-1]}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button onClick={e => { e.stopPropagation(); removeTrain(tr.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dimmer)', padding: 4, borderRadius: 6 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dimmer)'}
                  ><Trash size={14} /></button>
                  {expandedTrain === tr.id ? <CaretUp size={14} style={{ color: 'var(--text-dimmer)' }} /> : <CaretDown size={14} style={{ color: 'var(--text-dimmer)' }} />}
                </div>
              </div>
              {expandedTrain === tr.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--card-border)' }}>
                  {tr.good && <div style={{ fontSize: 12, color: '#22c55e', marginBottom: 6 }}>✅ {tr.good}</div>}
                  {tr.bad && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 6 }}>❌ {tr.bad}</div>}
                  {tr.notes && <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>{tr.notes}</div>}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── TRANSFER ── */}
      {tab === 'transfer' && (
        <>
          {/* Header stats */}
          {transfers.length > 0 && (() => {
            const avg = Math.round(transfers.reduce((s, t) => s + (t.probability || 0), 0) / transfers.length)
            const best = [...transfers].sort((a, b) => b.probability - a.probability)[0]
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <div className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)' }}>{transfers.length}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginTop: 2 }}>CLUBS VERFOLGT</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: avg >= 60 ? '#22c55e' : avg >= 30 ? '#f59e0b' : '#94a3b8' }}>{avg}%</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginTop: 2 }}>DURCHSCHN.</div>
                </div>
              </div>
            )
          })()}

          {/* Add / Edit form */}
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={() => { setShowTransferForm(v => !v); setEditingTransfer(null); setTransferForm(TRANSFER_BLANK) }}>
            <Plus size={15} /> {showTransferForm && !editingTransfer ? 'Schließen' : '+ Club hinzufügen'}
          </button>

          {showTransferForm && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="card-glow" />
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 12 }}>
                {editingTransfer ? 'Club bearbeiten' : 'Neuer Club'}
              </div>

              {/* Logo upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div onClick={() => transferLogoRef.current?.click()}
                  style={{ width: 60, height: 60, borderRadius: 14, background: 'var(--card)', border: '2px dashed var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
                  {transferForm.logo
                    ? <img src={transferForm.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <UploadSimple weight="fill" size={20} style={{ color: 'var(--text-dimmer)' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Club Logo</div>
                  <button type="button" className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => transferLogoRef.current?.click()}>
                    <UploadSimple weight="fill" size={12} /> {transferForm.logo ? 'Ändern' : 'UploadSimple'}
                  </button>
                  {transferForm.logo && (
                    <button type="button" onClick={() => setTransferForm(f => ({ ...f, logo: null }))}
                      style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-dimmer)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Entfernen
                    </button>
                  )}
                </div>
                <input ref={transferLogoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleTransferLogo} />
              </div>

              <div className="field-row c2" style={{ marginBottom: 10 }}>
                <div className="field">
                  <label className="field-label">Club / Verein *</label>
                  <input className="field-input" value={transferForm.club} placeholder="FK Bayern II..." onChange={e => setTransferForm(f => ({ ...f, club: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">Liga</label>
                  <input className="field-input" value={transferForm.league} placeholder="Regionalliga Bayern" onChange={e => setTransferForm(f => ({ ...f, league: e.target.value }))} />
                </div>
              </div>

              <div className="field-row c2" style={{ marginBottom: 10 }}>
                <div className="field">
                  <label className="field-label">Land</label>
                  <input className="field-input" value={transferForm.country} placeholder="Deutschland" onChange={e => setTransferForm(f => ({ ...f, country: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">Kontakt</label>
                  <input className="field-input" value={transferForm.contact} placeholder="Trainer, Agent..." onChange={e => setTransferForm(f => ({ ...f, contact: e.target.value }))} />
                </div>
              </div>

              {/* Status */}
              <div className="field" style={{ marginBottom: 12 }}>
                <label className="field-label">Status</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {Object.entries(TRANSFER_STATUSES).map(([key, s]) => (
                    <button key={key} type="button" onClick={() => setTransferForm(f => ({ ...f, status: key }))}
                      style={{ padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: transferForm.status === key ? 700 : 400,
                        border: `1.5px solid ${transferForm.status === key ? s.color : 'var(--card-border)'}`,
                        background: transferForm.status === key ? s.color + '20' : 'transparent',
                        color: transferForm.status === key ? s.color : 'var(--text-dim)' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Probability slider */}
              <div className="field" style={{ marginBottom: 12 }}>
                <label className="field-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Wahrscheinlichkeit</span>
                  <span style={{ fontWeight: 800, color: transferForm.probability >= 60 ? '#22c55e' : transferForm.probability >= 30 ? '#f59e0b' : '#94a3b8' }}>{transferForm.probability}%</span>
                </label>
                <input type="range" min="0" max="100" step="5" value={transferForm.probability}
                  onChange={e => setTransferForm(f => ({ ...f, probability: parseInt(e.target.value) }))}
                  style={{ width: '100%', marginTop: 6, accentColor: transferForm.probability >= 60 ? '#22c55e' : transferForm.probability >= 30 ? '#f59e0b' : '#94a3b8' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-dimmer)', marginTop: 2 }}>
                  <span>Unwahrscheinlich</span><span>Sehr wahrscheinlich</span>
                </div>
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label className="field-label">Notizen</label>
                <textarea className="field-input" rows={3} style={{ resize: 'none', fontSize: 12 }} value={transferForm.notes}
                  placeholder="Kontaktverlauf, Bedingungen, nächste Schritte..."
                  onChange={e => setTransferForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setShowTransferForm(false); setEditingTransfer(null); setTransferForm(TRANSFER_BLANK) }}>Abbrechen</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={submitTransfer}><Check size={14} /> {editingTransfer ? 'Speichern' : 'Hinzufügen'}</button>
              </div>
            </div>
          )}

          {/* Transfer list */}
          {transfers.length === 0 && !showTransferForm && (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-dimmer)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔄</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Noch keine Clubs</div>
              <div style={{ fontSize: 12 }}>Füge potenzielle Vereine hinzu</div>
            </div>
          )}

          {[...transfers].sort((a, b) => b.probability - a.probability).map(tr => {
            const st = TRANSFER_STATUSES[tr.status] || TRANSFER_STATUSES.interest
            const prob = tr.probability || 0
            const probColor = prob >= 60 ? '#22c55e' : prob >= 30 ? '#f59e0b' : '#94a3b8'
            return (
              <div key={tr.id} className="card" style={{ marginBottom: 10 }}>
                {/* Club header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: tr.logo ? 'var(--card)' : probColor + '18', border: `2px solid ${tr.logo ? 'var(--card-border)' : probColor + '40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {tr.logo
                      ? <img src={tr.logo} alt={tr.club} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                      : <span style={{ fontSize: 22, fontWeight: 900, color: probColor, lineHeight: 1 }}>{prob}%</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>{tr.club}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      {[tr.league, tr.country].filter(Boolean).join(' · ')}
                    </div>
                    {tr.contact && <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginTop: 1 }}>👤 {tr.contact}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: st.color + '20', color: st.color, border: `1px solid ${st.color}40` }}>
                      {st.label}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEditTransfer(tr)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dimmer)', padding: 3 }}><PencilSimple size={13} /></button>
                      <button onClick={() => removeTransfer(tr.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dimmer)', padding: 3 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dimmer)'}><Trash size={13} /></button>
                    </div>
                  </div>
                </div>

                {/* Probability bar */}
                <div style={{ marginBottom: tr.notes ? 10 : 0 }}>
                  <div style={{ height: 6, borderRadius: 6, background: 'var(--card-border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${prob}%`, borderRadius: 6, background: `linear-gradient(to right, ${probColor}80, ${probColor})`, transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {tr.notes && (
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, paddingTop: 8, borderTop: '1px solid var(--card-border)', marginTop: 2 }}>
                    {tr.notes}
                  </div>
                )}
              </div>
            )
          })}

          {transfers.filter(t => t.status === 'signed').length > 0 && (
            <div style={{ marginTop: 8, padding: '14px 16px', borderRadius: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>🎉</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>
                {transfers.filter(t => t.status === 'signed').map(t => t.club).join(', ')} — Unterschrieben!
              </div>
            </div>
          )}
        </>
      )}

      {/* ── BODY & RECOVERY ── */}
      {tab === 'body' && (
        <>
          {/* Injury status card */}
          <div className="card" style={{ marginBottom: 14, background: 'linear-gradient(135deg,rgba(239,68,68,0.08),rgba(239,68,68,0.03))', borderColor: 'rgba(239,68,68,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WarningCircle weight="fill" size={18} color="#ef4444" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Verletzungsstatus</div>
                <div style={{ fontSize: 11, color: 'var(--text-dimmer)' }}>
                  {injuryLog.phase === 'healthy' ? '✅ Fit & gesund' : injuryLog.phase === 'rehab' ? '🔄 Rehabilitation' : '⚠ In Behandlung'}
                </div>
              </div>
              <button onClick={() => { setInjuryDraft(injuryLog); setEditInjury(v => !v) }}
                style={{ background: editInjury ? 'rgba(239,68,68,0.15)' : 'var(--card)', border: `1px solid ${editInjury ? 'rgba(239,68,68,0.3)' : 'var(--card-border)'}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, color: editInjury ? '#ef4444' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5 }}>
                {editInjury ? <><X size={12} /> Abbrechen</> : <><PencilSimple size={12} /> Bearbeiten</>}
              </button>
            </div>

            {editInjury ? (
              <div style={{ paddingTop: 8, borderTop: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="field" style={{ marginBottom: 8 }}>
                  <label className="field-label">Verletzung / Diagnose</label>
                  <input className="field-input" value={injuryDraft.description || ''} placeholder="Muskelverletzung Oberschenkel..." onChange={e => setInjuryDraft(d => ({ ...d, description: e.target.value }))} />
                </div>
                <div className="field-row c2" style={{ marginBottom: 8 }}>
                  <div className="field">
                    <label className="field-label">Verletzt seit</label>
                    <input className="field-input" type="date" value={injuryDraft.startDate || ''} onChange={e => setInjuryDraft(d => ({ ...d, startDate: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="field-label">Zieldatum</label>
                    <input className="field-input" type="date" value={injuryDraft.targetDate || ''} onChange={e => setInjuryDraft(d => ({ ...d, targetDate: e.target.value }))} />
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 8 }}>
                  <label className="field-label">Phase</label>
                  <select className="field-input" value={injuryDraft.phase || 'rehab'} onChange={e => setInjuryDraft(d => ({ ...d, phase: e.target.value }))}>
                    <option value="injured">Verletzt</option>
                    <option value="rehab">Rehabilitation</option>
                    <option value="return">Wiedereinstieg</option>
                    <option value="healthy">Fit & gesund</option>
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label className="field-label">Notizen</label>
                  <textarea className="field-input" rows={2} style={{ resize: 'none', fontSize: 12 }} value={injuryDraft.notes || ''} placeholder="Arztbericht, Übungen..." onChange={e => setInjuryDraft(d => ({ ...d, notes: e.target.value }))} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={saveInjury}><Check size={14} /> Speichern</button>
              </div>
            ) : (
              injuryLog.description ? (
                <div style={{ paddingTop: 8, borderTop: '1px solid rgba(239,68,68,0.15)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{injuryLog.description}</div>
                  {(injuryLog.startDate || injuryLog.targetDate) && (
                    <div style={{ fontSize: 11, color: 'var(--text-dimmer)' }}>
                      {injuryLog.startDate && `Seit: ${new Date(injuryLog.startDate).toLocaleDateString('de-DE')}`}
                      {injuryLog.targetDate && ` · Ziel: ${new Date(injuryLog.targetDate).toLocaleDateString('de-DE')}`}
                    </div>
                  )}
                  {injuryLog.notes && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.5 }}>{injuryLog.notes}</div>}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--text-dimmer)', paddingTop: 4 }}>Keine Verletzung dokumentiert. Klicke auf Bearbeiten.</div>
              )
            )}
          </div>

          {/* Weight chart — mini bar chart */}
          {bodyEntries.length > 1 && (() => {
            const last8 = [...bodyEntries].filter(e => e.weight).slice(0, 8).reverse()
            const weights = last8.map(e => parseFloat(e.weight) || 0)
            const minW = Math.min(...weights) - 1
            const maxW = Math.max(...weights) + 1
            const range = maxW - minW || 1
            return (
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dimmer)', letterSpacing: '1.5px', marginBottom: 10 }}>GEWICHTSVERLAUF</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60 }}>
                  {last8.map((e, i) => {
                    const h = ((weights[i] - minW) / range) * 50 + 10
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div style={{ fontSize: 8, color: 'var(--accent)', fontWeight: 700 }}>{weights[i]}</div>
                        <div style={{ width: '100%', height: h, background: 'linear-gradient(to top,var(--accent),rgba(59,130,246,0.4))', borderRadius: 4 }} />
                        <div style={{ fontSize: 7, color: 'var(--text-dimmer)', textAlign: 'center' }}>
                          {new Date(e.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Add body entry */}
          <button className="btn btn-outline" style={{ width: '100%', marginBottom: 12 }} onClick={() => setShowBodyForm(v => !v)}>
            <Pulse weight="fill" size={14} /> {showBodyForm ? 'Schließen' : 'Körperdaten eintragen'}
          </button>

          {showBodyForm && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-glow" />
              <div className="field-row c2" style={{ marginBottom: 8 }}>
                <div className="field">
                  <label className="field-label">Datum</label>
                  <input className="field-input" type="date" value={bodyForm.date} onChange={e => setBodyForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">Gewicht (kg)</label>
                  <input className="field-input" type="number" step="0.1" min="40" max="150" value={bodyForm.weight} placeholder="75.5" onChange={e => setBodyForm(f => ({ ...f, weight: e.target.value }))} />
                </div>
              </div>
              <div className="field" style={{ marginBottom: 8 }}>
                <label className="field-label">Schmerzlevel: {bodyForm.painLevel}/10</label>
                <input type="range" min="0" max="10" value={bodyForm.painLevel} onChange={e => setBodyForm(f => ({ ...f, painLevel: e.target.value }))}
                  style={{ width: '100%', accentColor: bodyForm.painLevel > 6 ? '#ef4444' : bodyForm.painLevel > 3 ? '#f59e0b' : '#22c55e' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-dimmer)', marginTop: 2 }}>
                  <span>Kein Schmerz</span><span>Starker Schmerz</span>
                </div>
              </div>
              <div className="field" style={{ marginBottom: 10 }}>
                <label className="field-label">Notiz</label>
                <textarea className="field-input" rows={2} style={{ resize: 'none', fontSize: 12 }} value={bodyForm.notes} placeholder="Wie fühlt sich der Körper an..." onChange={e => setBodyForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={submitBodyEntry}><Check size={14} /> Speichern</button>
            </div>
          )}

          {/* Body entries list */}
          {bodyEntries.slice(0, 10).map(e => (
            <div key={e.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--accent)' }}>{e.weight || '—'}</div>
                  <div style={{ fontSize: 8, color: 'var(--text-dimmer)' }}>kg</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                    {e.date ? new Date(e.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }) : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <div style={{ fontSize: 10, color: parseInt(e.painLevel) > 6 ? '#ef4444' : parseInt(e.painLevel) > 3 ? '#f59e0b' : '#22c55e', fontWeight: 700 }}>
                      Schmerz: {e.painLevel}/10
                    </div>
                    {e.notes && <div style={{ fontSize: 10, color: 'var(--text-dimmer)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {e.notes}</div>}
                  </div>
                </div>
                <button onClick={() => removeBodyEntry(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dimmer)', padding: 4 }}>
                  <Trash size={14} />
                </button>
              </div>
            </div>
          ))}

          {bodyEntries.length === 0 && !showBodyForm && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dimmer)', fontSize: 13 }}>Noch keine Körperdaten. Trage dein erstes ein!</div>
          )}

          {/* Physio sessions */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dimmer)', letterSpacing: '1.5px', marginBottom: 10 }}>PHYSIOTHERAPIE / REHAB</div>
            <button className="btn btn-outline" style={{ width: '100%', marginBottom: 12 }} onClick={() => setShowPhysioForm(v => !v)}>
              <Heart weight="fill" size={14} /> {showPhysioForm ? 'Schließen' : 'Sitzung hinzufügen'}
            </button>

            {showPhysioForm && (
              <div className="card" style={{ marginBottom: 12 }}>
                <div className="field-row c2" style={{ marginBottom: 8 }}>
                  <div className="field">
                    <label className="field-label">Datum</label>
                    <input className="field-input" type="date" value={physioForm.date} onChange={e => setPhysioForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="field-label">Typ</label>
                    <select className="field-input" value={physioForm.type} onChange={e => setPhysioForm(f => ({ ...f, type: e.target.value }))}>
                      {['Physiotherapie', 'Massagetherapie', 'Kältebehandlung', 'Wärmebehandlung', 'Elektrotherapie', 'Aquajogging', 'Kraftrehab', 'Dehnprogramm', 'Arzttermin'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field-row c2" style={{ marginBottom: 8 }}>
                  <div className="field">
                    <label className="field-label">Dauer (min)</label>
                    <input className="field-input" type="number" min="0" value={physioForm.duration} placeholder="60" onChange={e => setPhysioForm(f => ({ ...f, duration: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="field-label">Bewertung</label>
                    <select className="field-input" value={physioForm.rating} onChange={e => setPhysioForm(f => ({ ...f, rating: e.target.value }))}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{RATINGS[n-1]}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 8 }}>
                  <label className="field-label">Übungen / Behandlung</label>
                  <input className="field-input" value={physioForm.exercises} placeholder="Dehnübungen, Massage Oberschenkel..." onChange={e => setPhysioForm(f => ({ ...f, exercises: e.target.value }))} />
                </div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label className="field-label">Notizen</label>
                  <textarea className="field-input" rows={2} style={{ resize: 'none', fontSize: 12 }} value={physioForm.notes} placeholder="Fortschritte, Arztempfehlung..." onChange={e => setPhysioForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={submitPhysio}><Check size={14} /> Speichern</button>
              </div>
            )}

            {(injuryLog.sessions || []).length === 0 && !showPhysioForm && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dimmer)', fontSize: 13 }}>Keine Sitzungen. Füge deine erste hinzu!</div>
            )}

            {(injuryLog.sessions || []).map(s => (
              <div key={s.id} className="card" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Heart weight="fill" size={18} color="#ef4444" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.type}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dimmer)', marginTop: 2 }}>
                      {s.date ? new Date(s.date).toLocaleDateString('de-DE') : ''}{s.duration ? ` · ${s.duration} min` : ''} · {RATINGS[(s.rating||3)-1]}
                    </div>
                    {s.exercises && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.exercises}</div>}
                  </div>
                  <button onClick={() => removePhysio(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dimmer)', padding: 4, flexShrink: 0 }}>
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
