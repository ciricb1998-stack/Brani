import { useState, useEffect } from 'react'
import { useApp } from '../App.jsx'
import { BRANDS } from '../data/brands.js'
import { saveAIKey, loadAIKey } from '../utils/storage.js'
import { saveNotifSettings, loadNotifSettings, requestPermission, showNotif } from '../utils/notifications.js'
import { savePIN, checkPIN } from './PinScreen.jsx'
import { saveSlackWebhook, loadSlackWebhook, sendToSlack } from '../utils/slack.js'

function loadClaudeKey() {
  const raw = localStorage.getItem('brani_claude_key')
  if (!raw) return ''
  try { return JSON.parse(raw) || '' } catch { return raw }
}
function saveClaudeKey(k) { localStorage.setItem('brani_claude_key', JSON.stringify(k)) }
function loadBraniProfileLocal() {
  try { return JSON.parse(localStorage.getItem('brani_ai_profile') || 'null') || { name: '', address: '', facts: '' } } catch { return { name: '', address: '', facts: '' } }
}
function saveBraniProfileLocal(p) { localStorage.setItem('brani_ai_profile', JSON.stringify(p)) }

async function saveElevenLabsKey(k) {
  const { saveData } = await import('../utils/storage.js')
  saveData('elevenlabs_key', k)
  const { syncSave } = await import('../utils/sync.js')
  syncSave('elevenlabs_key', k)
}
function loadElevenLabsKey() {
  const raw = localStorage.getItem('brani_elevenlabs_key')
  if (!raw) return ''
  try { return JSON.parse(raw) || '' } catch { return raw }
}
import { saveGmailEmail, loadGmailEmail, saveGmailPass, loadGmailPass } from '../utils/gemini.js'
import { Bell, Brain, DownloadSimple, CalendarBlank, ArrowsClockwise, Lock, Hash, Envelope } from '@phosphor-icons/react'

const BRAND_COLORS = { branip: '#2563EB', brani: '#F97316', log: '#A855F7' }

export default function SettingsScreen() {
  const { settings, updateSettings, t, setScreen } = useApp()
  const accent = BRAND_COLORS[settings.brand] || '#F97316'
  const [aiKey, setAiKey] = useState(loadAIKey())
  const [slackWebhook, setSlackWebhook] = useState(loadSlackWebhook())
  const [slackSaved, setSlackSaved] = useState(false)
  const [slackTesting, setSlackTesting] = useState(false)
  const [gmailEmail, setGmailEmail] = useState(loadGmailEmail())
  const [gmailPass, setGmailPass] = useState(loadGmailPass())
  const [gmailSaved, setGmailSaved] = useState(false)
  const [showGmailPass, setShowGmailPass] = useState(false)
  const [elevenKey, setElevenKey] = useState(loadElevenLabsKey())
  const [elevenSaved, setElevenSaved] = useState(false)
  const [showElevenKey, setShowElevenKey] = useState(false)
  const [claudeKey, setClaudeKey] = useState(loadClaudeKey())
  const [claudeSaved, setClaudeSaved] = useState(false)
  const [showClaudeKey, setShowClaudeKey] = useState(false)
  const [braniProfile, setBraniProfile] = useState(loadBraniProfileLocal())
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    const handler = () => {
      const fresh = loadAIKey()
      if (fresh) setAiKey(fresh)
    }
    window.addEventListener('brani-sync', handler)
    return () => window.removeEventListener('brani-sync', handler)
  }, [])
  const [aiSaved, setAiSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinMsg, setPinMsg] = useState(null)
  const [notif, setNotif] = useState(loadNotifSettings())
  const [permStatus, setPermStatus] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')

  function updateNotif(patch) {
    const next = { ...notif, ...patch }
    setNotif(next)
    saveNotifSettings(next)
  }

  async function handlePermission() {
    const result = await requestPermission()
    setPermStatus(result)
    if (result === 'granted') updateNotif({ enabled: true })
  }

  function testNotification() {
    showNotif('🔔 BRANI System', t.notif_active)
  }

  function saveKey() {
    saveAIKey(aiKey.trim())
    setAiSaved(true)
    setTimeout(() => setAiSaved(false), 2000)
  }

  function saveWebhook() {
    saveSlackWebhook(slackWebhook.trim())
    setSlackSaved(true)
    setTimeout(() => setSlackSaved(false), 2000)
  }

  function saveGmail() {
    saveGmailEmail(gmailEmail.trim())
    saveGmailPass(gmailPass.trim())
    setGmailSaved(true)
    setTimeout(() => setGmailSaved(false), 2000)
  }

  async function testSlack() {
    saveSlackWebhook(slackWebhook.trim())
    setSlackTesting(true)
    const result = await sendToSlack('✅ BRANI System — Slack veza radi!')
    setSlackTesting(false)
    if (!result.ok) alert('Greška: ' + (result.reason || 'nepoznata greška'))
  }

  function changePin() {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinMsg({ ok: false, msg: t.pin_must_4 }); return
    }
    if (!checkPIN(oldPin)) {
      setPinMsg({ ok: false, msg: t.old_pin_wrong }); return
    }
    savePIN(newPin)
    setOldPin(''); setNewPin('')
    setPinMsg({ ok: true, msg: t.pin_changed })
    setTimeout(() => setPinMsg(null), 2500)
  }

  const notifStatus = permStatus === 'granted'
    ? (notif.enabled ? t.notif_active : t.notif_granted)
    : permStatus === 'denied' ? t.notif_denied : t.notif_pending

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">EINSTELLUNGEN</div>
          <div className="screen-title">{t.profile}</div>
          <div className="screen-sub">{t.settings_sub}</div>
        </div>
      </div>

      {/* Brand */}
      <div className="section-title">{t.active_brand}</div>
      <div className="brand-selector">
        {Object.values(BRANDS).map(b => (
          <div key={b.id} className={`brand-option${settings.brand === b.id ? ' on' : ''}`} onClick={() => updateSettings({ brand: b.id })}>
            <div className="brand-dot" style={{ background: BRAND_COLORS[b.id] }} />
            <div style={{ flex: 1 }}>
              <div className="brand-name">{b.fullName}</div>
              <div className="brand-tagline">{b.tagline}</div>
            </div>
            {settings.brand === b.id && (
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, color: 'white', fontWeight: 700 }}>✓</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Language */}
      <div className="section-title">{t.language}</div>
      <div className="set-row">
        {[['bs','Bosanski'],['de','Deutsch'],['en','English']].map(([id, label]) => (
          <button key={id} className={`set-btn${settings.lang === id ? ' on' : ''}`} onClick={() => updateSettings({ lang: id })}>{label}</button>
        ))}
      </div>

      {/* Theme */}
      <div className="section-title">{t.theme}</div>
      <div className="set-row">
        <button className={`set-btn${settings.theme === 'dark' ? ' on' : ''}`} onClick={() => updateSettings({ theme: 'dark' })}>{t.dark_theme}</button>
        <button className={`set-btn${settings.theme === 'light' ? ' on' : ''}`} onClick={() => updateSettings({ theme: 'light' })}>{t.light_theme}</button>
      </div>

      {/* Notifications */}
      <div className="section-title">{t.notifications}</div>
      <div className="card">
        <div className="card-glow" />
        <div className="card-header">
          <div className="card-icon">
            <Bell weight="fill" size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title">{t.smart_reminders}</div>
            <div className="card-sub">{notifStatus}</div>
          </div>
          {permStatus === 'granted' && (
            <div
              onClick={() => updateNotif({ enabled: !notif.enabled })}
              style={{ width: 44, height: 24, borderRadius: 12, background: notif.enabled ? 'var(--green)' : 'var(--card-border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <div style={{ position: 'absolute', top: 3, left: notif.enabled ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
            </div>
          )}
        </div>

        {permStatus !== 'granted' && permStatus !== 'denied' && (
          <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={handlePermission}>
            <Bell weight="fill" size={16} />
            {t.allow_notifications}
          </button>
        )}

        {permStatus === 'granted' && (
          <>
            <div className="field-row c3" style={{ marginBottom: 10 }}>
              <div className="field">
                <label className="field-label">{t.morning}</label>
                <input className="field-input" type="time" value={notif.morning} onChange={e => updateNotif({ morning: e.target.value })} />
              </div>
              <div className="field">
                <label className="field-label">{t.midday}</label>
                <input className="field-input" type="time" value={notif.midday} onChange={e => updateNotif({ midday: e.target.value })} />
              </div>
              <div className="field">
                <label className="field-label">{t.evening}</label>
                <input className="field-input" type="time" value={notif.evening} onChange={e => updateNotif({ evening: e.target.value })} />
              </div>
            </div>
            <div className="check-row" onClick={() => updateNotif({ streakWarning: !notif.streakWarning })}>
              <div className={`check-box${notif.streakWarning ? ' on' : ''}`} />
              <span className="check-label" style={{ fontSize: 13 }}>{t.streak_warning}</span>
            </div>
            <div className="check-row" onClick={() => updateNotif({ aiTip: !notif.aiTip })}>
              <div className={`check-box${notif.aiTip ? ' on' : ''}`} />
              <span className="check-label" style={{ fontSize: 13 }}>{t.ai_tip}</span>
            </div>
            <button className="btn btn-outline" style={{ marginTop: 10 }} onClick={testNotification}>
              {t.test_notif}
            </button>
          </>
        )}
        <div style={{ fontSize: 11, color: 'var(--text-dimmer)', marginTop: 10, lineHeight: 1.5 }}>
          {t.notif_info}
        </div>
      </div>

      {/* AI Coach */}
      <div className="section-title">{t.ai_coach_title}</div>
      <div className="card">
        <div className="card-glow" style={{ background: 'var(--purple-dim)' }} />
        <div className="card-header">
          <div className="card-icon" style={{ background: 'var(--purple-dim)' }}>
            <Brain weight="fill" size={18} style={{ color: 'var(--purple)' }} />
          </div>
          <div>
            <div className="card-title" style={{ color: 'var(--purple)' }}>Claude AI Key</div>
            <div className="card-sub">{aiKey ? t.api_key_set : t.api_key_missing}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 10 }}>
          {t.api_key_info}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            className="field-input" style={{ flex: 1 }}
            type={showKey ? 'text' : 'password'}
            value={aiKey} onChange={e => setAiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
          />
          <button
            onClick={() => setShowKey(p => !p)}
            style={{ padding: '0 12px', background: 'var(--card)', border: '0.5px solid var(--card-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-dim)', fontSize: 12, fontFamily: 'inherit' }}
          >{showKey ? t.hide : t.show}</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1, background: aiSaved ? 'var(--green)' : 'var(--purple)' }} onClick={saveKey}>
            {aiSaved ? '✓ ' + t.saved : t.save_key}
          </button>
          {aiKey && (
            <button className="btn btn-outline" onClick={() => { setAiKey(''); saveAIKey('') }}>
              {t.remove}
            </button>
          )}
        </div>
      </div>

      {/* Slack */}
      <div className="section-title">{t.slack_integration}</div>
      <div className="card">
        <div className="card-glow" style={{ background: 'rgba(74,144,226,0.08)' }} />
        <div className="card-header">
          <div className="card-icon" style={{ background: 'rgba(74,144,226,0.12)' }}>
            <Hash size={18} style={{ color: '#4A90E2' }} />
          </div>
          <div>
            <div className="card-title" style={{ color: '#4A90E2' }}>Slack</div>
            <div className="card-sub">{slackWebhook ? t.slack_connected : t.slack_not_set}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 10 }}>
          {t.slack_info}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            className="field-input" style={{ flex: 1, fontSize: 12 }}
            type="url"
            value={slackWebhook}
            onChange={e => setSlackWebhook(e.target.value)}
            placeholder={t.slack_webhook_placeholder}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, background: slackSaved ? 'var(--green)' : '#4A90E2' }}
            onClick={saveWebhook}
            disabled={!slackWebhook}
          >
            {slackSaved ? '✓ ' + t.saved : t.slack_save_webhook}
          </button>
          {slackWebhook && (
            <button className="btn btn-outline" onClick={testSlack} disabled={slackTesting}>
              {slackTesting ? '...' : t.slack_test_msg}
            </button>
          )}
          {slackWebhook && (
            <button className="btn btn-outline" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => { saveSlackWebhook(''); setSlackWebhook('') }}>
              {t.remove}
            </button>
          )}
        </div>
      </div>

      {/* BRANI AI Profil */}
      <div className="section-title">BRANI Asistent — Profil</div>
      <div className="card" style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#333', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Tvoje ime</div>
            <input value={braniProfile.name} onChange={e => setBraniProfile(p => ({ ...p, name: e.target.value }))}
              placeholder="Branislav Ćirić"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0a0a0a', border: '1px solid #1e1e1e', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#333', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Kako ti se obraća</div>
            <input value={braniProfile.address} onChange={e => setBraniProfile(p => ({ ...p, address: e.target.value }))}
              placeholder="Branislave / Šefe / Gospodine Ćirić"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0a0a0a', border: '1px solid #1e1e1e', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#333', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>O tebi (činjenice, ciljevi, kontekst)</div>
            <textarea value={braniProfile.facts} onChange={e => setBraniProfile(p => ({ ...p, facts: e.target.value }))}
              placeholder="Bivši profesionalni nogometaš u oporavku od povrede. Firma u Njemačkoj — IT za medicinske prakse. Cilj: povratak u fudbal i 10k€/mj prihod do kraja 2026..."
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0a0a0a', border: '1px solid #1e1e1e', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
          </div>
          <button className="btn btn-primary"
            style={{ background: profileSaved ? '#22c55e' : accent }}
            onClick={() => { saveBraniProfileLocal(braniProfile); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2000) }}>
            {profileSaved ? '✓ Gespeichert' : 'Profil speichern'}
          </button>
        </div>
      </div>

      {/* ElevenLabs */}
      <div className="section-title">ElevenLabs — AI-Stimme</div>
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-header">
          <div className="card-icon" style={{ background: `${accent}18` }}>
            <Bell weight="fill" size={18} style={{ color: accent }} />
          </div>
          <div>
            <div className="card-title" style={{ color: accent }}>ElevenLabs</div>
            <div className="card-sub">{elevenKey ? '✓ API Key gesetzt' : 'Kein API Key'}</div>
          </div>
        </div>
        <div style={{ position: 'relative', margin: '12px 0 8px' }}>
          <input
            type={showElevenKey ? 'text' : 'password'}
            value={elevenKey}
            onChange={e => setElevenKey(e.target.value)}
            placeholder="sk_..."
            style={{
              width: '100%', padding: '11px 40px 11px 14px',
              borderRadius: 10, background: '#0a0a0a',
              border: `1px solid ${elevenKey ? accent + '50' : '#1e1e1e'}`,
              color: 'var(--text)', fontSize: 13,
              fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button onClick={() => setShowElevenKey(s => !s)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#444', fontSize: 14,
          }}>{showElevenKey ? '🙈' : '👁'}</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1, background: elevenSaved ? '#22c55e' : accent }}
            onClick={() => { saveElevenLabsKey(elevenKey.trim()); setElevenSaved(true); setTimeout(() => setElevenSaved(false), 2000) }}
            disabled={!elevenKey}>
            {elevenSaved ? '✓ Gespeichert' : 'Speichern'}
          </button>
          {elevenKey && (
            <button className="btn btn-outline" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
              onClick={() => { saveElevenLabsKey(''); setElevenKey('') }}>
              Entfernen
            </button>
          )}
        </div>
      </div>

      {/* Gmail */}
      <div className="section-title">Gmail — Email slanje</div>
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-glow" style={{ background: 'rgba(234,68,68,0.06)' }} />
        <div className="card-header">
          <div className="card-icon" style={{ background: 'rgba(234,68,68,0.1)' }}>
            <Envelope weight="fill" size={18} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <div className="card-title" style={{ color: '#ef4444' }}>Gmail</div>
            <div className="card-sub">{gmailEmail && gmailPass ? `✓ ${gmailEmail}` : 'Nije konfigurisan'}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.6 }}>
          Treba ti <strong style={{ color: 'var(--text)' }}>App Password</strong> — ne tvoja normalna lozinka.<br />
          Google Account → Security → 2-Step Verification → App passwords → kreiraj novu
        </div>
        <div className="field" style={{ marginBottom: 8 }}>
          <label className="field-label">Gmail adresa</label>
          <input className="field-input" type="email" value={gmailEmail} onChange={e => setGmailEmail(e.target.value)} placeholder="tvoj@gmail.com" />
        </div>
        <div className="field" style={{ marginBottom: 10 }}>
          <label className="field-label">App Password (16 znakova)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="field-input" style={{ flex: 1 }}
              type={showGmailPass ? 'text' : 'password'}
              value={gmailPass}
              onChange={e => setGmailPass(e.target.value)}
              placeholder="abcd efgh ijkl mnop"
            />
            <button onClick={() => setShowGmailPass(p => !p)} style={{ padding: '0 12px', background: 'var(--card)', border: '0.5px solid var(--card-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-dim)', fontSize: 12, fontFamily: 'inherit' }}>
              {showGmailPass ? t.hide : t.show}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1, background: gmailSaved ? 'var(--green)' : '#ef4444' }} onClick={saveGmail} disabled={!gmailEmail || !gmailPass}>
            {gmailSaved ? '✓ ' + t.saved : t.save_key}
          </button>
          {(gmailEmail || gmailPass) && <button className="btn btn-outline" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => { saveGmailEmail(''); saveGmailPass(''); setGmailEmail(''); setGmailPass('') }}>{t.remove}</button>}
        </div>
      </div>

      {/* Data */}
      <div className="section-title">{t.data_export}</div>
      <div className="card">
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setScreen('export')}>
            <DownloadSimple weight="fill" size={16} />
            {t.export_import}
          </button>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setScreen('calendar')}>
            <CalendarBlank weight="fill" size={16} />
            {t.calendar}
          </button>
        </div>
      </div>

      {/* Reset / Onboarding */}
      <div className="section-title">{t.goals_onboarding}</div>
      <div className="card">
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.6 }}>
          {t.goals_onboarding_desc}
        </div>
        <button
          className="btn btn-outline"
          style={{ width: '100%', borderColor: 'var(--accent)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={() => {
            localStorage.removeItem('brani_onboarded')
            window.location.reload()
          }}
        >
          <ArrowsClockwise weight="fill" size={14} />
          {t.repeat_onboarding}
        </button>
      </div>

      {/* PIN */}
      <div className="section-title">{t.pin_protection}</div>
      <div className="card">
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.6 }}>
          {t.pin_default_desc} <strong style={{ color: 'var(--text)' }}>1998</strong>. {t.pin_change_here}
        </div>
        <div className="field-row c2" style={{ marginBottom: 10 }}>
          <div className="field">
            <label className="field-label">{t.old_pin}</label>
            <input className="field-input" type="password" inputMode="numeric" maxLength={4} value={oldPin} onChange={e => setOldPin(e.target.value.replace(/\D/g,''))} placeholder="••••" />
          </div>
          <div className="field">
            <label className="field-label">{t.new_pin}</label>
            <input className="field-input" type="password" inputMode="numeric" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g,''))} placeholder="••••" />
          </div>
        </div>
        {pinMsg && (
          <div style={{ fontSize: 12, color: pinMsg.ok ? 'var(--green)' : 'var(--red)', marginBottom: 8, fontWeight: 600 }}>
            {pinMsg.msg}
          </div>
        )}
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={changePin}>
          <Lock weight="fill" size={14} />
          {t.change_pin}
        </button>
      </div>

      {/* App info */}
      <div className="section-title">{t.about}</div>
      <div className="card">
        {[[t.version,'v2.1 Premium'],['Storage','Local (offline)'],['Platform','PWA · iOS/Android'],['AI','Claude Sonnet']].map(([k,v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid var(--card-border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{k}</span>
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 7 }}>
          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{t.install_label}</span>
          <span className="badge badge-accent">PWA</span>
        </div>
      </div>

      {/* Install tip */}
      <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--accent-dim)', border: '0.5px solid var(--accent)', borderRadius: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>{t.install_app}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>iPhone:</strong> {t.install_iphone}<br />
          <strong style={{ color: 'var(--text)' }}>Android:</strong> {t.install_android}
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '20px 0 4px', fontSize: 10, color: 'var(--text-dimmer)', letterSpacing: '1.5px' }}>
        BRANI SYSTEM · BUILT WITH DISCIPLINE
      </div>
    </div>
  )
}
