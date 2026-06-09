import { useState } from 'react'
import { useApp } from '../App.jsx'
import { loadBDLClients, loadBDLMeetings, loadAIKey } from '../utils/storage.js'
import { claudeDraftEmail, sendGmailEmail, hasGmail, saveEmailToHistory, loadEmailHistory, deleteEmailFromHistory, clearEmailHistory } from '../utils/gemini.js'
import { buildBrandedEmail, emailToPdfBlob } from '../utils/emailTemplate.js'
import { Sparkle, PaperPlaneTilt, Copy, Check, Clock, Eye, FileArrowDown, Trash } from '@phosphor-icons/react'

const TONES = [
  { id: 'formal',  label: { bs: 'Formalan',     de: 'Formell',     en: 'Formal' } },
  { id: 'semi',    label: { bs: 'Polu-formalan', de: 'Halbformell', en: 'Semi-formal' } },
  { id: 'direct',  label: { bs: 'Direktan',      de: 'Direkt',      en: 'Direct' } },
]

const LANGS = [
  { id: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { id: 'en', flag: '🇬🇧', label: 'English' },
  { id: 'bs', flag: '🇧🇦', label: 'Bosanski' },
]

export default function BDLEmailComposerScreen() {
  const { t, settings, setScreen } = useApp()
  const clients = loadBDLClients()
  const allMeetings = loadBDLMeetings()

  const [selectedClient, setSelectedClient] = useState(null)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [context, setContext] = useState('')
  const [emailLang, setEmailLang] = useState('de')
  const [tone, setTone] = useState('formal')
  const [draft, setDraft] = useState('')
  const [htmlEmail, setHtmlEmail] = useState('')
  const [previewMode, setPreviewMode] = useState('text')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('composer')
  const [history, setHistory] = useState(loadEmailHistory)

  const claudeKey = loadAIKey()
  const gmailOk = hasGmail()
  const claudeOk = !!claudeKey

  const clientMeetings = selectedClient
    ? allMeetings
        .filter(m => m.clientName?.toLowerCase() === selectedClient.name?.toLowerCase())
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 5)
    : []

  function selectClient(c) {
    setSelectedClient(selectedClient?.id === c.id ? null : c)
    if (c.email) setRecipientEmail(c.email)
  }

  async function generate() {
    if (!context.trim()) { setError('Opiši o čemu se radi.'); return }
    if (!claudeKey) { setError('API ključ nije postavljen — idi u Profil → AI Coach.'); return }
    setError('')
    setGenerating(true)
    setDraft('')
    setHtmlEmail('')
    try {
      const text = await claudeDraftEmail({
        context: context.trim(),
        client: selectedClient,
        meetings: clientMeetings,
        lang: emailLang,
        tone,
        apiKey: claudeKey,
      })
      setDraft(text)
      setHtmlEmail(buildBrandedEmail(text, { subject }))
      setPreviewMode('preview')
    } catch (e) {
      setError('Greška: ' + e.message)
    }
    setGenerating(false)
  }

  async function send() {
    if (!recipientEmail.trim()) { setError('Unesi email primatelja.'); return }
    if (!subject.trim()) { setError('Unesi subject.'); return }
    if (!draft.trim()) { setError('Nema emaila za slanje.'); return }
    setError('')
    setSending(true)
    try {
      const currentHtml = buildBrandedEmail(draft, { subject })
      await sendGmailEmail({ to: recipientEmail.trim(), subject: subject.trim(), body: draft, html: currentHtml })
      saveEmailToHistory({ to: recipientEmail.trim(), subject: subject.trim(), body: draft, clientName: selectedClient?.name || '', lang: emailLang })
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } catch (e) {
      setError('Greška pri slanju: ' + e.message)
    }
    setSending(false)
  }

  function copyHtml() {
    navigator.clipboard.writeText(buildBrandedEmail(draft, { subject }))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function downloadPdf() {
    if (!draft) return
    setPdfLoading(true)
    try {
      const html = buildBrandedEmail(draft, { subject })
      const blob = await emailToPdfBlob(html, subject)
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `email-${(subject || 'brani').replace(/\s+/g, '-').toLowerCase()}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) { setError('PDF greška: ' + e.message) }
    setPdfLoading(false)
  }

  function onDraftChange(val) {
    setDraft(val)
    setHtmlEmail(buildBrandedEmail(val, { subject }))
  }

  function deleteOne(id) {
    deleteEmailFromHistory(id)
    setHistory(h => h.filter(e => e.id !== id))
  }

  function deleteAll() {
    if (!window.confirm('Obrisati cijelu historiju?')) return
    clearEmailHistory()
    setHistory([])
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">AI COMPOSER</div>
          <div className="screen-title">AI Email Composer</div>
          <div className="screen-sub">Claude piše · Branded HTML · Gmail šalje</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="set-row" style={{ marginBottom: 14 }}>
        <button className={`set-btn${tab === 'composer' ? ' on' : ''}`} onClick={() => setTab('composer')}>
          <Sparkle weight="fill" size={13} /> Composer
        </button>
        <button className={`set-btn${tab === 'history' ? ' on' : ''}`} onClick={() => setTab('history')}>
          <Clock weight="fill" size={13} /> Historija ({history.length})
        </button>
      </div>

      {/* ── HISTORIJA ── */}
      {tab === 'history' && (
        history.length === 0
          ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dimmer)', fontSize: 13 }}>Nema poslatih emailova još.</div>
          : <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                <button onClick={deleteAll} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                  <Trash size={12} /> Obriši sve
                </button>
              </div>
              {history.map(h => (
                <div key={h.id} className="card" style={{ marginBottom: 8, position: 'relative' }}>
                  <button onClick={() => deleteOne(h.id)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dimmer)', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dimmer)'}
                  >
                    <Trash size={14} />
                  </button>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 3, paddingRight: 28 }}>{h.subject}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>
                    → {h.to} {h.clientName && `· ${h.clientName}`} · {new Date(h.sentAt).toLocaleDateString('de-DE')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dimmer)', lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'hidden' }}>{h.body}</div>
                </div>
              ))}
            </>
      )}

      {/* ── COMPOSER ── */}
      {tab === 'composer' && (
        <>
          {/* Status */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: claudeOk ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)', border: `1px solid ${claudeOk ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)'}`, color: claudeOk ? 'var(--green)' : '#ef4444' }}>
              {claudeOk ? '✓ Claude AI' : '✗ Claude — dodaj API ključ u Profil'}
            </div>
            <div style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: gmailOk ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)', border: `1px solid ${gmailOk ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)'}`, color: gmailOk ? 'var(--green)' : '#ef4444' }}>
              {gmailOk ? '✓ Gmail' : '✗ Gmail — postavi u Profil'}
            </div>
          </div>

          {/* Klijenti */}
          {clients.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dimmer)', letterSpacing: '1px', marginBottom: 6 }}>KLIJENT — Claude zna sve o njemu</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {clients.map(c => (
                  <button key={c.id} onClick={() => selectClient(c)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: selectedClient?.id === c.id ? 'var(--accent-dim)' : 'var(--card)', border: `1px solid ${selectedClient?.id === c.id ? 'var(--accent)' : 'var(--card-border)'}`, color: selectedClient?.id === c.id ? 'var(--accent)' : 'var(--text-dim)', transition: 'all 0.15s' }}>
                    {c.name}
                  </button>
                ))}
              </div>
              {selectedClient && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 10, fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Claude zna: </span>
                  {selectedClient.name} · {selectedClient.practice || '—'} · {selectedClient.status || '—'}
                  {selectedClient.monthlyValue ? ` · ${selectedClient.monthlyValue}€/mj` : ''}
                  {clientMeetings.length > 0 ? ` · ${clientMeetings.length} meetinga` : ''}
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-glow" />
            <div className="field-row c2" style={{ marginBottom: 10 }}>
              <div className="field">
                <label className="field-label">Email primatelja</label>
                <input className="field-input" type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="doktor@praxis.de" />
              </div>
              <div className="field">
                <label className="field-label">Subject</label>
                <input className="field-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Angebot IT-Infrastruktur" />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label className="field-label">O čemu se radi? — Claude koristi ovaj opis + klijent + meetinzi</label>
              <textarea className="field-input" rows={3} value={context} onChange={e => setContext(e.target.value)} placeholder="npr. Šaljem ponudu 300€/mj za IT infrastrukturu. Hoću da budem profesionalan i da zakazem termin." style={{ resize: 'none' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dimmer)', letterSpacing: '1px', marginBottom: 6 }}>JEZIK</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {LANGS.map(l => (
                  <button key={l.id} onClick={() => setEmailLang(l.id)} style={{ flex: 1, padding: '7px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: emailLang === l.id ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${emailLang === l.id ? 'var(--accent)' : 'var(--card-border)'}`, color: emailLang === l.id ? 'var(--accent)' : 'var(--text-dim)', transition: 'all 0.15s' }}>
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dimmer)', letterSpacing: '1px', marginBottom: 6 }}>TON</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {TONES.map(to_ => (
                  <button key={to_.id} onClick={() => setTone(to_.id)} style={{ flex: 1, padding: '7px', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: tone === to_.id ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${tone === to_.id ? 'var(--accent)' : 'var(--card-border)'}`, color: tone === to_.id ? 'var(--accent)' : 'var(--text-dim)', transition: 'all 0.15s' }}>
                    {to_.label[settings.lang] || to_.label.de}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', opacity: (!claudeOk || generating) ? 0.7 : 1 }} onClick={generate} disabled={!claudeOk || generating}>
              <Sparkle weight="fill" size={15} />
              {generating ? 'Claude analizira kontekst i piše...' : 'Generiši branded email'}
            </button>
          </div>

          {/* Draft + Preview */}
          {(draft || generating) && (
            <div className="card" style={{ marginBottom: 12 }}>
              {generating ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '20px 0', color: 'var(--text-dim)', fontSize: 13 }}>
                  <div style={{ width: 18, height: 18, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Claude piše profesionalni email...
                </div>
              ) : (
                <>
                  {/* Toggle text/preview */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    <button onClick={() => setPreviewMode('text')} style={{ flex: 1, padding: '7px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: previewMode === 'text' ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${previewMode === 'text' ? 'var(--accent)' : 'var(--card-border)'}`, color: previewMode === 'text' ? 'var(--accent)' : 'var(--text-dim)' }}>
                      ✏️ Uredi tekst
                    </button>
                    <button onClick={() => setPreviewMode('preview')} style={{ flex: 1, padding: '7px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: previewMode === 'preview' ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${previewMode === 'preview' ? 'var(--accent)' : 'var(--card-border)'}`, color: previewMode === 'preview' ? 'var(--accent)' : 'var(--text-dim)' }}>
                      <Eye size={12} style={{ marginRight: 4 }} />Preview
                    </button>
                  </div>

                  {previewMode === 'text' ? (
                    <textarea className="field-input" rows={12} value={draft} onChange={e => onDraftChange(e.target.value)} style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.7, fontFamily: 'inherit' }} />
                  ) : (
                    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                      <iframe
                        srcDoc={htmlEmail}
                        style={{ width: '100%', height: 520, border: 'none', display: 'block' }}
                        title="Email preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" style={{ flex: 1, minWidth: 100 }} onClick={copyHtml}>
                      {copied ? <><Check size={13} /> Kopirano!</> : <><Copy size={13} /> Kopiraj HTML</>}
                    </button>
                    <button className="btn btn-outline" style={{ flex: 1, minWidth: 100 }} onClick={downloadPdf} disabled={pdfLoading}>
                      <FileArrowDown weight="fill" size={13} /> {pdfLoading ? 'Generiram...' : 'PDF'}
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 2, minWidth: 140, background: sent ? 'var(--green)' : undefined, opacity: (!gmailOk || sending) ? 0.7 : 1 }}
                      onClick={send} disabled={!gmailOk || sending}
                    >
                      {sent ? <><Check size={13} /> Poslano!</> : sending ? 'Šaljem...' : <><PaperPlaneTilt weight="fill" size={13} /> Pošalji via Gmail</>}
                    </button>
                  </div>
                  {!gmailOk && <div style={{ fontSize: 11, color: 'var(--text-dimmer)', marginTop: 6, textAlign: 'center' }}>Gmail nije konfigurisan — kopiraj HTML i pošalji ručno</div>}
                </>
              )}
            </div>
          )}

          {error && (
            <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, fontSize: 13, color: '#fca5a5', marginBottom: 12 }}>
              {error}
            </div>
          )}
        </>
      )}
    </div>
  )
}
