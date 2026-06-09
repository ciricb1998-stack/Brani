import { useState, useRef, useEffect } from 'react'
import { useApp } from '../App.jsx'
import { loadBDLClients, saveBDLClients } from '../utils/storage.js'
import { loadInvoiceSettings } from '../utils/invoiceStorage.js'
import {
  Envelope, Phone, CaretLeft, Plus, FileText, Stack,
  PencilLine, X, MagnifyingGlass, Trash, PencilSimple, PaperPlaneTilt,
} from '@phosphor-icons/react'

const STATUSES = {
  prospect: { label: 'Prospect',  color: '#F59E0B' },
  active:   { label: 'Aktiv',     color: '#10B981' },
  paused:   { label: 'Pause',     color: '#94A3B8' },
  inactive: { label: 'Inaktiv',   color: '#EF4444' },
}

const TYPES    = ['Hausarzt', 'Zahnarzt', 'Physiotherapie', 'Facharzt', 'Apotheke', 'Krankenhaus', 'Sonstiges']
const SERVICES = ['IT-Support', 'Cybersicherheit', 'NIS2 / DSGVO', 'Backup', 'Microsoft 365', 'Website / App', 'Digitalisierung', 'KI-Beratung', 'Helpdesk', 'Netzwerk', 'Schulungen', 'TOM-Dokumentation']

const EMAIL_TEMPLATES = s => ({
  angebot: {
    label: 'Angebot begleiten',
    subject: `Ihr IT-Angebot – ${s.companyName || 'Brani Digitale Lösungen'}`,
    body: (c) => `Sehr geehrte/r ${c.name},\n\nvielen Dank für Ihr Interesse an unseren IT-Dienstleistungen.\n\nIm Anhang finden Sie unser individuelles Angebot für ${c.practice || 'Ihre Praxis'}. Bitte nehmen Sie sich einen Moment, um die Leistungen und Konditionen zu prüfen.\n\nBei Fragen stehe ich Ihnen gerne zur Verfügung — rufen Sie mich an oder schreiben Sie mir direkt zurück.\n\nMit freundlichen Grüßen,\n${s.ownerName || 'Branislav Ćirić'}\n${s.companyName || 'Brani Digitale Lösungen'}\n${s.email || 'contact@branislavciric.com'}\n${s.website || 'www.branislavciric.com'}`,
  },
  vertragspaket: {
    label: 'Vertragspaket zusenden',
    subject: `Ihre Vertragsunterlagen – ${s.companyName || 'Brani Digitale Lösungen'}`,
    body: (c) => `Sehr geehrte/r ${c.name},\n\nvielen Dank für Ihr Vertrauen. Im Anhang finden Sie alle Unterlagen für den Start unserer Zusammenarbeit:\n\n  •  IT-Dienstleistungsvertrag\n  •  Geheimhaltungsvereinbarung (NDA)\n  •  Auftragsverarbeitungsvertrag (Art. 28 DSGVO)\n  •  Service Level Agreement (SLA)\n\nBitte prüfen Sie die Unterlagen und senden Sie mir die unterzeichneten Exemplare zurück.\n\nBei Rückfragen stehe ich Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen,\n${s.ownerName || 'Branislav Ćirić'}\n${s.companyName || 'Brani Digitale Lösungen'}\n${s.email || 'contact@branislavciric.com'}`,
  },
  willkommen: {
    label: 'Willkommen / Onboarding',
    subject: `Herzlich willkommen – Ihre IT-Betreuung startet`,
    body: (c) => `Sehr geehrte/r ${c.name},\n\nwir freuen uns sehr, Sie als neuen Klienten begrüßen zu dürfen!\n\nIn Kürze erhalten Sie eine Einladung zu Ihrem persönlichen Slack-Kanal — Ihr direkter Draht zu uns für alle Anfragen und den laufenden Support.\n\nBeim nächsten Termin führen wir gemeinsam die IT-Bestandsaufnahme durch und erstellen Ihren individuellen IT-Aktionsplan.\n\nBei Fragen können Sie sich jederzeit per E-Envelope oder Slack melden.\n\nWir freuen uns auf die Zusammenarbeit!\n\nMit freundlichen Grüßen,\n${s.ownerName || 'Branislav Ćirić'}\n${s.companyName || 'Brani Digitale Lösungen'}\n${s.email || 'contact@branislavciric.com'}`,
  },
  wartung: {
    label: 'Wartungsbesuch bestätigen',
    subject: `IT-Wartung – Termin & Zusammenfassung`,
    body: (c) => `Sehr geehrte/r ${c.name},\n\nvielen Dank für Ihren heutigen Termin. Im Anhang finden Sie das Wartungsprotokoll mit einer Übersicht der durchgeführten Arbeiten.\n\nBitte prüfen Sie das Protokoll und senden Sie mir die unterzeichnete Kopie zurück.\n\nBei Fragen stehe ich Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen,\n${s.ownerName || 'Branislav Ćirić'}\n${s.companyName || 'Brani Digitale Lösungen'}\n${s.email || 'contact@branislavciric.com'}`,
  },
  freitext: {
    label: 'Freitext',
    subject: '',
    body: (c) => `Sehr geehrte/r ${c.name},\n\n\n\nMit freundlichen Grüßen,\n${s.ownerName || 'Branislav Ćirić'}\n${s.companyName || 'Brani Digitale Lösungen'}`,
  },
})

const BLANK = {
  id: '', name: '', practice: '', type: 'Hausarzt',
  street: '', plz: '', city: '',
  email: '', phone: '',
  status: 'prospect', monthlyValue: '', since: '',
  services: [], notes: '', signature: null,
}

// ── Signature pad ─────────────────────────────────────────────────────────────
function SignaturePad({ value, onChange }) {
  const ref   = useRef(null)
  const drawing = useRef(false)
  const last    = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    const ctx = ref.current.getContext('2d')
    ctx.clearRect(0, 0, ref.current.width, ref.current.height)
    if (value) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = value
    }
  }, [value])

  function pos(e) {
    const r = ref.current.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return { x: (src.clientX - r.left) * (ref.current.width / r.width), y: (src.clientY - r.top) * (ref.current.height / r.height) }
  }

  function down(e) {
    drawing.current = true
    last.current = pos(e)
    const ctx = ref.current.getContext('2d')
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y)
  }

  function move(e) {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = ref.current.getContext('2d')
    const p = pos(e)
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0f172a'
    ctx.lineTo(p.x, p.y); ctx.stroke()
    last.current = p
  }

  function up() {
    if (!drawing.current) return
    drawing.current = false
    onChange(ref.current.toDataURL())
  }

  function clear() {
    ref.current.getContext('2d').clearRect(0, 0, ref.current.width, ref.current.height)
    onChange(null)
  }

  return (
    <div>
      <canvas ref={ref} width={540} height={150}
        style={{ width: '100%', height: 100, background: '#f8fafc', borderRadius: 10, border: '1.5px dashed var(--card-border)', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
        onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up}
        onTouchStart={down} onTouchMove={move} onTouchEnd={up}
      />
      <button type="button" onClick={clear} style={{ fontSize: 10, color: 'var(--text-dimmer)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginTop: 3, padding: 0 }}>
        Löschen
      </button>
    </div>
  )
}

// ── Email composer ────────────────────────────────────────────────────────────
function EmailComposer({ client, onClose }) {
  const s = loadInvoiceSettings()
  const tpls = EMAIL_TEMPLATES(s)
  const [tpl, setTpl]       = useState('angebot')
  const [subject, setSubject] = useState('')
  const [body, setBody]       = useState('')
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    const t = tpls[tpl]
    setSubject(t.subject)
    setBody(t.body(client))
  }, [tpl])

  function openMail() {
    window.location.href = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  function copy() {
    navigator.clipboard.writeText(`Betreff: ${subject}\n\n${body}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          <CaretLeft size={16} /> Zurück
        </button>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>E-Envelope an {client.name}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* Template selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {Object.entries(tpls).map(([key, t]) => (
            <button key={key} type="button" onClick={() => setTpl(key)}
              style={{ padding: '5px 11px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: tpl === key ? 700 : 400, border: `1.5px solid ${tpl === key ? 'var(--accent)' : 'var(--card-border)'}`, background: tpl === key ? 'var(--accent-dim)' : 'var(--card)', color: tpl === key ? 'var(--accent)' : 'var(--text-dim)', transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Subject */}
        <div style={{ marginBottom: 10 }}>
          <label className="field-label">Betreff</label>
          <input className="field-input" value={subject} onChange={e => setSubject(e.target.value)} />
        </div>

        {/* Body */}
        <div style={{ marginBottom: 14 }}>
          <label className="field-label">Nachricht</label>
          <textarea className="field-input" rows={14} value={body} onChange={e => setBody(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 12, lineHeight: 1.7 }} />
        </div>

        <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', borderRadius: 10, fontSize: 11, color: 'var(--text-dimmer)', marginBottom: 14 }}>
          PDFs herunterladen (Dokumente-Screen) → E-Envelope öffnen → PDFs als Anhang hinzufügen
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {client.email && (
            <button className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={openMail}>
              <PaperPlaneTilt weight="fill" size={14} /> In E-Envelope-App öffnen
            </button>
          )}
          <button className="btn btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={copy}>
            {copied ? '✓ Kopiert!' : 'Text kopieren'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BDLClientsScreen() {
  const { setScreen } = useApp()
  const [clients, setClients]   = useState(loadBDLClients)
  const [search, setSearch]     = useState('')
  const [view, setView]         = useState('list') // 'list' | 'detail' | 'form' | 'email' | 'signature'
  const [activeId, setActiveId] = useState(null)
  const [form, setForm]         = useState({ ...BLANK })

  function save(list) { setClients(list); saveBDLClients(list) }

  function openAdd() {
    setForm({ ...BLANK, id: Math.random().toString(36).slice(2, 9) })
    setActiveId(null); setView('form')
  }

  function openEdit(c) { setForm({ ...c }); setActiveId(c.id); setView('form') }

  function submitForm() {
    if (!form.name && !form.practice) return
    const isNew = !clients.find(c => c.id === form.id)
    save(isNew ? [form, ...clients] : clients.map(c => c.id === form.id ? form : c))
    setActiveId(form.id); setView('detail')
  }

  function deleteClient(id) { save(clients.filter(c => c.id !== id)); setView('list'); setActiveId(null) }

  function saveSignature(sig) {
    const updated = clients.map(c => c.id === activeId ? { ...c, signature: sig } : c)
    save(updated); setView('detail')
  }

  function openAngebot(c) {
    localStorage.setItem('brani_quick_client', JSON.stringify({
      clientName: c.practice || c.name,
      doctorName: c.name,
      clientStreet: c.street || '',
      clientCity: [c.plz, c.city].filter(Boolean).join(' '),
      clientEmail: c.email || '',
      mode: 'angebot',
    }))
    setScreen('bdl_documents')
  }

  function openOnboarding(c) {
    localStorage.setItem('brani_quick_client', JSON.stringify({
      clientName: c.practice || c.name,
      doctorName: c.name,
      clientStreet: c.street || '',
      clientCity: [c.plz, c.city].filter(Boolean).join(' '),
      clientEmail: c.email || '',
      mode: 'onboarding',
    }))
    setScreen('bdl_documents')
  }

  const client  = clients.find(c => c.id === activeId)
  const filtered = clients.filter(c =>
    [c.name, c.practice, c.city, c.email].some(v => (v || '').toLowerCase().includes(search.toLowerCase()))
  )
  const mrr = clients.filter(c => c.status === 'active').reduce((s, c) => s + (parseFloat(c.monthlyValue) || 0), 0)

  // ── Email view ──────────────────────────────────────────────────────────────
  if (view === 'email' && client) return <EmailComposer client={client} onClose={() => setView('detail')} />

  // ── Signature view ──────────────────────────────────────────────────────────
  if (view === 'signature' && client) return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button onClick={() => setView('detail')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          <CaretLeft size={16} /> Zurück
        </button>
        <div className="screen-title" style={{ fontSize: 15 }}>Unterschrift — {client.name}</div>
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Handunterschrift erfassen</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 14 }}>Unterschrift mit Finger oder Stift direkt auf dem Gerät einzeichnen. Wird im Klientenprofil gespeichert.</div>
        <SignaturePad value={client.signature} onChange={sig => {
          const updated = clients.map(c => c.id === activeId ? { ...c, signature: sig } : c)
          save(updated)
        }} />
      </div>
      <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setView('detail')}>
        Speichern & Zurück
      </button>
    </div>
  )

  // ── Form view ───────────────────────────────────────────────────────────────
  if (view === 'form') return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button onClick={() => setView(activeId ? 'detail' : 'list')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          <CaretLeft size={16} /> Zurück
        </button>
        <div className="screen-title" style={{ fontSize: 15 }}>{activeId ? 'Klient bearbeiten' : 'Neuer Klient'}</div>
      </div>

      <div className="card" style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dimmer)', letterSpacing: '0.8px', marginBottom: 10 }}>KONTAKT</div>
        {[
          [['name', 'Ansprechpartner', 'Dr. Max Müller'], ['practice', 'Praxis / Unternehmen', 'Praxis Dr. Müller']],
          [['email', 'E-Envelope', 'info@praxis.de'], ['phone', 'Telefon', '+49 89 ...']],
          [['street', 'Straße & Nr.', 'Musterstraße 1'], ['plz', 'PLZ', '80000']],
        ].map((row, ri) => (
          <div key={ri} className="field-row c2" style={{ marginBottom: 10 }}>
            {row.map(([key, label, ph]) => (
              <div key={key} className="field">
                <label className="field-label">{label}</label>
                <input className="field-input" value={form[key] || ''} placeholder={ph} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
        ))}
        <div className="field" style={{ marginBottom: 10 }}>
          <label className="field-label">Stadt</label>
          <input className="field-input" value={form.city || ''} placeholder="München" onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dimmer)', letterSpacing: '0.8px', marginBottom: 10 }}>DETAILS</div>
        <div className="field-row c2" style={{ marginBottom: 10 }}>
          <div className="field">
            <label className="field-label">Typ</label>
            <select className="field-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {TYPES.map(tp => <option key={tp}>{tp}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Status</label>
            <select className="field-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="field-row c2" style={{ marginBottom: 10 }}>
          <div className="field">
            <label className="field-label">Monatlich (€)</label>
            <input className="field-input" type="number" value={form.monthlyValue || ''} placeholder="0" onChange={e => setForm(f => ({ ...f, monthlyValue: e.target.value }))} />
          </div>
          <div className="field">
            <label className="field-label">Klient seit</label>
            <input className="field-input" type="date" value={form.since || ''} onChange={e => setForm(f => ({ ...f, since: e.target.value }))} />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 10 }}>
          <label className="field-label">Leistungen</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {SERVICES.map(s => {
              const on = form.services?.includes(s)
              return (
                <button key={s} type="button" onClick={() => setForm(f => ({ ...f, services: on ? f.services.filter(x => x !== s) : [...(f.services || []), s] }))}
                  style={{ padding: '4px 10px', borderRadius: 100, border: `1px solid ${on ? 'var(--accent)' : 'var(--card-border)'}`, background: on ? 'var(--accent-dim)' : 'transparent', color: on ? 'var(--accent)' : 'var(--text-dim)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {s}
                </button>
              )
            })}
          </div>
        </div>
        <div className="field">
          <label className="field-label">Notizen</label>
          <textarea className="field-input" rows={3} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Besonderheiten, wichtige Infos..." style={{ resize: 'none' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {activeId && (
          <button className="btn btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={() => { if (confirm('Klient löschen?')) deleteClient(activeId) }}>
            <Trash size={14} />
          </button>
        )}
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setView(activeId ? 'detail' : 'list')}>Abbrechen</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={submitForm}>Speichern</button>
      </div>
    </div>
  )

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (view === 'detail' && client) return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          <CaretLeft size={16} /> Klienten
        </button>
        <div style={{ flex: 1 }}>
          <div className="screen-title" style={{ fontSize: 15 }}>{client.practice || client.name}</div>
          <div className="screen-sub">{client.type}</div>
        </div>
        <button onClick={() => openEdit(client)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'inherit' }}>
          <PencilSimple size={14} /> Edit
        </button>
      </div>

      {/* Status + MRR header */}
      <div className="card" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
          {(client.practice || client.name || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: STATUSES[client.status]?.color, background: STATUSES[client.status]?.color + '18', padding: '2px 8px', borderRadius: 20 }}>
              {STATUSES[client.status]?.label}
            </span>
            {client.monthlyValue && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{parseFloat(client.monthlyValue).toLocaleString('de-DE')} €/mo</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{client.name}{client.since ? ` · seit ${new Date(client.since).toLocaleDateString('de-DE', { year: 'numeric', month: 'short' })}` : ''}</div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <button onClick={() => openAngebot(client)}
          style={{ padding: '12px 10px', borderRadius: 14, border: '1.5px solid rgba(14,116,144,0.4)', background: 'rgba(14,116,144,0.06)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} color="#0e7490" />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0e7490' }}>Angebot</div>
            <div style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>PDF erstellen</div>
          </div>
        </button>
        <button onClick={() => openOnboarding(client)}
          style={{ padding: '12px 10px', borderRadius: 14, border: '1.5px solid rgba(79,70,229,0.4)', background: 'rgba(79,70,229,0.06)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Stack weight="fill" size={18} color="#4f46e5" />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>Onboarding</div>
            <div style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>Paket erstellen</div>
          </div>
        </button>
        {client.email && (
          <button onClick={() => setView('email')}
            style={{ padding: '12px 10px', borderRadius: 14, border: '1.5px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.06)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Envelope weight="fill" size={18} color="#10b981" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>E-Envelope</div>
              <div style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>{client.email}</div>
            </div>
          </button>
        )}
        {client.phone && (
          <button onClick={() => window.location.href = `tel:${client.phone}`}
            style={{ padding: '12px 10px', borderRadius: 14, border: '1.5px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.06)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone weight="fill" size={18} color="#f59e0b" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Anrufen</div>
              <div style={{ fontSize: 10, color: 'var(--text-dimmer)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>{client.phone}</div>
            </div>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="card" style={{ marginBottom: 10 }}>
        {[
          ['Praxis', client.practice],
          ['Adresse', [client.street, [client.plz, client.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')],
          ['E-Envelope', client.email],
          ['Telefon', client.phone],
        ].filter(([, v]) => v).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid var(--card-border)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0, marginRight: 10 }}>{k}</span>
            <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, textAlign: 'right' }}>{v}</span>
          </div>
        ))}
        {client.services?.length > 0 && (
          <div style={{ paddingTop: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginBottom: 6, fontWeight: 700, letterSpacing: '0.5px' }}>LEISTUNGEN</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {client.services.map(s => <span key={s} style={{ padding: '3px 9px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 10, fontWeight: 600 }}>{s}</span>)}
            </div>
          </div>
        )}
        {client.notes && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>{client.notes}</div>}
      </div>

      {/* Signature */}
      <div className="card" style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Unterschrift</div>
          <button onClick={() => setView('signature')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--card-border)', background: 'var(--card)', color: 'var(--accent)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            <PencilLine weight="fill" size={12} /> {client.signature ? 'Ändern' : 'Erfassen'}
          </button>
        </div>
        {client.signature
          ? <img src={client.signature} alt="Unterschrift" style={{ width: '100%', height: 80, objectFit: 'contain', borderRadius: 8, background: '#f8fafc' }} />
          : <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dimmer)', fontSize: 12, background: 'var(--card)', borderRadius: 8, border: '1px dashed var(--card-border)' }}>Noch keine Unterschrift erfasst</div>
        }
      </div>
    </div>
  )

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">KUNDEN</div>
          <div className="screen-title">Klienten</div>
          <div className="screen-sub">
            {clients.filter(c => c.status === 'active').length} aktiv
            {mrr > 0 && <span style={{ color: 'var(--accent)', fontWeight: 700 }}> · {mrr.toLocaleString('de-DE')} €/mo MRR</span>}
          </div>
        </div>
        <button onClick={openAdd} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-dim)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
          <Plus size={18} />
        </button>
      </div>

      {/* MagnifyingGlass */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <MagnifyingGlass weight="fill" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dimmer)', pointerEvents: 'none' }} />
        <input className="field-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient, Praxis, Stadt suchen..." style={{ paddingLeft: 34 }} />
      </div>

      {/* Status filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 2 }}>
        {Object.entries(STATUSES).map(([k, v]) => {
          const n = clients.filter(c => c.status === k).length
          if (!n) return null
          return (
            <button key={k} type="button" onClick={() => setSearch(v.label === search ? '' : v.label)}
              style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${v.color}40`, background: `${v.color}12`, color: v.color, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {v.label} {n}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-dimmer)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{search ? 'Kein Ergebnis' : 'Noch keine Klienten'}</div>
          {!search && <div style={{ fontSize: 12, color: 'var(--text-dimmer)' }}>Ersten Klienten hinzufügen</div>}
        </div>
      ) : filtered.map(c => (
        <div key={c.id} className="card" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => { setActiveId(c.id); setView('detail') }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
              {(c.practice || c.name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.practice || c.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.name}{c.city ? ` · ${c.city}` : ''}{c.type ? ` · ${c.type}` : ''}
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: STATUSES[c.status]?.color, marginBottom: 3 }}>{STATUSES[c.status]?.label}</div>
              {c.monthlyValue ? <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{parseFloat(c.monthlyValue).toLocaleString('de-DE')} €</div> : null}
              {c.signature ? <div style={{ fontSize: 9, color: 'var(--text-dimmer)', marginTop: 2 }}>✓ Unterschrift</div> : null}
            </div>
          </div>
          {c.services?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
              {c.services.slice(0, 4).map(s => <span key={s} style={{ padding: '2px 7px', borderRadius: 5, background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 9, fontWeight: 600 }}>{s}</span>)}
              {c.services.length > 4 && <span style={{ padding: '2px 7px', borderRadius: 5, background: 'var(--card-border)', color: 'var(--text-dimmer)', fontSize: 9 }}>+{c.services.length - 4}</span>}
            </div>
          )}
        </div>
      ))}

      <button className="btn btn-primary" style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={openAdd}>
        <Plus size={16} /> Neuen Klienten hinzufügen
      </button>
    </div>
  )
}
