import { useState, useMemo } from 'react'
import { useApp } from '../App.jsx'
import {
  User, FileText, ArrowsClockwise, ArrowRight, Wrench, CurrencyDollar,
  Copy, Envelope, Check, CaretLeft, PencilSimple, PaperPlaneTilt, Lightning, Star,
  HandshakeIcon, Phone, WarningCircle, X
} from '@phosphor-icons/react'

const TEMPLATES = [
  {
    id: 'erstkontakt',
    category: 'Erstkontakt',
    subtitle: 'Digitalisierung Ihrer Praxis – Brani Digitale Lösungen',
    color: '#3b82f6',
    icon: 'user',
    vars: ['NAME', 'PRAXIS'],
    subject: 'Digitalisierung Ihrer Praxis – Brani Digitale Lösungen',
    body: `Sehr geehrte/r [NAME],

mein Name ist Branislav Ćirić. Ich bin Gründer von Brani Digitale Lösungen, einem Unternehmen, das sich auf IT-Infrastruktur, Cybersicherheit und die digitale Transformation medizinischer Einrichtungen spezialisiert hat.

In meiner Arbeit mit Arztpraxen und medizinischen Einrichtungen stelle ich regelmäßig fest, dass veraltete IT-Systeme, mangelnde Datensicherheit und fehlende digitale Prozesse den Praxisalltag erheblich belasten – und gleichzeitig ein erhebliches Haftungsrisiko darstellen.

Ich würde mich sehr freuen, Ihnen in einem unverbindlichen Gespräch (20–30 Minuten) aufzuzeigen, wie Sie Ihre Praxis sicherer, effizienter und zukunftsfähig aufstellen können – ohne Unterbrechung des laufenden Betriebs.

Haben Sie in der kommenden Woche einen freien Termin?

Mit freundlichen Grüßen
Branislav Ćirić
Gründer – Brani Digitale Lösungen
📞 +49 [TELEFON] | ✉ ciricb1998@gmail.com`,
  },
  {
    id: 'angebot',
    category: 'Angebot',
    subtitle: 'Ihr Angebot – [SERVICE] | Brani Digitale Lösungen',
    color: '#a855f7',
    icon: 'file',
    vars: ['NAME', 'DATUM', 'SERVICE'],
    subject: 'Ihr individuelles Angebot – [SERVICE] | Brani Digitale Lösungen',
    body: `Sehr geehrte/r [NAME],

vielen Dank für unser Gespräch vom [DATUM] und das entgegengebrachte Vertrauen.

Wie besprochen, sende ich Ihnen hiermit unser maßgeschneidertes Angebot für [SERVICE]. Das Angebot beinhaltet:

• Vollständige Leistungsbeschreibung und Zeitplan
• Transparente Preisgestaltung ohne versteckte Kosten
• Garantierte Reaktionszeiten und Support-Leistungen
• DSGVO-konforme Umsetzung aller Maßnahmen

Im Anhang finden Sie alle Details. Ich bin überzeugt, dass unsere Lösung Ihren Anforderungen optimal entspricht.

Für Fragen oder Anpassungswünsche stehe ich selbstverständlich jederzeit zur Verfügung – ich freue mich auf Ihre Rückmeldung bis spätestens [DATUM].

Mit freundlichen Grüßen
Branislav Ćirić
Brani Digitale Lösungen
📞 +49 [TELEFON] | ✉ ciricb1998@gmail.com`,
  },
  {
    id: 'followup',
    category: 'Follow-up',
    subtitle: 'Nachfrage – Unser Angebot vom [DATUM]',
    color: '#22c55e',
    icon: 'refresh',
    vars: ['NAME', 'DATUM'],
    subject: 'Kurze Nachfrage – Unser Angebot vom [DATUM]',
    body: `Sehr geehrte/r [NAME],

ich hoffe, Sie sind gut in die neue Woche gestartet und hatten die Gelegenheit, sich unser Angebot vom [DATUM] in Ruhe anzuschauen.

Ich wollte kurz nachfragen, ob Sie noch offene Fragen haben oder ob es Punkte gibt, die wir gemeinsam anpassen sollten. Es liegt mir fern, Druck auszuüben – ich möchte lediglich sicherstellen, dass Sie alle Informationen haben, die Sie für eine fundierte Entscheidung benötigen.

Falls Sie grundsätzlich Interesse haben, aber der Zeitpunkt noch nicht passt, freue ich mich auch über eine kurze Rückmeldung – so können wir gemeinsam den richtigen Moment finden.

Ich stehe für ein Gespräch jederzeit zur Verfügung.

Mit freundlichen Grüßen
Branislav Ćirić
Brani Digitale Lösungen
📞 +49 [TELEFON] | ✉ ciricb1998@gmail.com`,
  },
  {
    id: 'onboarding',
    category: 'Onboarding',
    subtitle: 'Willkommen – Start unserer Zusammenarbeit',
    color: '#f59e0b',
    icon: 'arrow',
    vars: ['NAME', 'PRAXIS', 'STARTDATUM'],
    subject: 'Willkommen bei Brani Digitale Lösungen – Nächste Schritte',
    body: `Sehr geehrte/r [NAME],

herzlichen Glückwunsch – mit der Entscheidung für Brani Digitale Lösungen haben Sie einen wichtigen Schritt in Richtung sichere, moderne und zukunftsfähige IT-Infrastruktur für [PRAXIS] gemacht.

Ich freue mich sehr auf unsere Zusammenarbeit und möchte dafür sorgen, dass der Start so reibungslos wie möglich verläuft.

Unsere nächsten Schritte:
1. Ersttermin vor Ort: [STARTDATUM]
2. Bestandsaufnahme der aktuellen IT-Infrastruktur
3. Einrichtung und Konfiguration der vereinbarten Systeme
4. Schulung Ihres Teams (nach Bedarf)
5. Laufender Support und regelmäßige Sicherheitschecks

Sie können mich jederzeit direkt per E-Envelope oder Telefon erreichen. Mein Ziel ist es, für Sie immer erreichbar zu sein – ganz ohne lange Wartezeiten.

Auf eine erfolgreiche Zusammenarbeit!

Mit freundlichen Grüßen
Branislav Ćirić
Brani Digitale Lösungen
📞 +49 [TELEFON] | ✉ ciricb1998@gmail.com`,
  },
  {
    id: 'support',
    category: 'Support',
    subtitle: 'Ihr Support-Anliegen – Brani Digitale Lösungen',
    color: '#ef4444',
    icon: 'wrench',
    vars: ['NAME', 'DATUM'],
    subject: 'Ihr Support-Anliegen – Wir kümmern uns darum',
    body: `Sehr geehrte/r [NAME],

vielen Dank für Ihre Meldung. Wir haben Ihr Anliegen erhalten und nehmen es mit höchster Priorität in Bearbeitung.

Unser Ziel ist es, Probleme so schnell wie möglich zu lösen, damit der Praxisbetrieb nicht beeinträchtigt wird.

Was passiert als nächstes:
• Sie erhalten spätestens bis [DATUM] eine detaillierte Rückmeldung
• Falls nötig, kommen wir persönlich vorbei oder schalten uns remote auf
• Alle Maßnahmen werden lückenlos dokumentiert

Bei dringenden Problemen, die den Praxisbetrieb unmittelbar gefährden, erreichen Sie mich auch direkt:
📞 +49 [TELEFON] (auch außerhalb der Geschäftszeiten)

Ich danke Ihnen für Ihr Vertrauen.

Mit freundlichen Grüßen
Branislav Ćirić
Brani Digitale Lösungen`,
  },
  {
    id: 'rechnung',
    category: 'Rechnung',
    subtitle: 'Rechnung [NR.] – Brani Digitale Lösungen',
    color: '#06b6d4',
    icon: 'dollar',
    vars: ['NAME', 'NR.', 'DATUM', 'BETRAG', 'FÄLLIGKEITSDATUM'],
    subject: 'Rechnung Nr. [NR.] – Brani Digitale Lösungen',
    body: `Sehr geehrte/r [NAME],

im Anhang erhalten Sie Rechnung Nr. [NR.] vom [DATUM] über den Betrag von [BETRAG] EUR (inkl. MwSt.) für die erbrachten Leistungen.

Zahlungsdetails:
• Betrag: [BETRAG] EUR
• Fälligkeitsdatum: [FÄLLIGKEITSDATUM]
• Verwendungszweck: Rechnung [NR.]

Bei Fragen zur Rechnung oder zu einzelnen Leistungspositionen stehe ich selbstverständlich gerne zur Verfügung.

Vielen Dank für die angenehme Zusammenarbeit – ich freue mich auf weitere gemeinsame Projekte.

Mit freundlichen Grüßen
Branislav Ćirić
Brani Digitale Lösungen
✉ ciricb1998@gmail.com | IBAN: DE[IBAN]`,
  },
  {
    id: 'nis2',
    category: 'NIS2 / DSGVO',
    subtitle: 'Compliance-Beratung für Ihre Praxis',
    color: '#f97316',
    icon: 'alert',
    vars: ['NAME', 'PRAXIS'],
    subject: 'NIS2 & DSGVO-Konformität – Handlungsbedarf für [PRAXIS]',
    body: `Sehr geehrte/r [NAME],

seit Oktober 2024 gilt die neue NIS2-Richtlinie auch für viele medizinische Einrichtungen in Deutschland. Gleichzeitig werden die Anforderungen der DSGVO im Gesundheitssektor strenger geprüft und Bußgelder konsequenter durchgesetzt.

Was das für [PRAXIS] konkret bedeutet:
• Nachweispflicht für technische und organisatorische Schutzmaßnahmen
• Meldepflichten bei Sicherheitsvorfällen innerhalb von 24 Stunden
• Dokumentationspflichten für alle IT-Systeme und Datenzugriffe
• Regelmäßige Risikoanalysen und Schulungen für Mitarbeiter

Ich unterstütze medizinische Einrichtungen dabei, diese Anforderungen rechtssicher und praxisnah umzusetzen – ohne den laufenden Betrieb zu beeinträchtigen.

In einem kostenlosen Erstgespräch (30 Min.) analysiere ich gemeinsam mit Ihnen den aktuellen Stand und zeige konkrete nächste Schritte auf.

Haben Sie in dieser oder nächster Woche Zeit für ein kurzes Gespräch?

Mit freundlichen Grüßen
Branislav Ćirić
Brani Digitale Lösungen – NIS2 & DSGVO Spezialist
📞 +49 [TELEFON] | ✉ ciricb1998@gmail.com`,
  },
  {
    id: 'abschluss',
    category: 'Vertragsabschluss',
    subtitle: 'Bestätigung unserer Vereinbarung',
    color: '#10b981',
    icon: 'handshake',
    vars: ['NAME', 'PRAXIS', 'SERVICE', 'DATUM'],
    subject: 'Bestätigung unserer Vereinbarung – [SERVICE]',
    body: `Sehr geehrte/r [NAME],

ich freue mich sehr, Ihnen die Bestätigung unserer Vereinbarung vom [DATUM] zukommen zu lassen.

Zusammenfassung unserer Vereinbarung:
• Leistung: [SERVICE]
• Auftraggeber: [PRAXIS]
• Starttermin: [DATUM]
• Ansprechpartner Ihrerseits: [NAME]
• Ansprechpartner unsererseits: Branislav Ćirić

Im Anhang finden Sie den unterzeichneten Vertrag zur Ihrer Ablage. Alle weiteren Details zu Zeitplan und Abläufen wurden wie besprochen festgelegt.

Ich freue mich darauf, gemeinsam mit Ihnen [PRAXIS] digital nach vorne zu bringen.

Bei Fragen stehe ich jederzeit zur Verfügung.

Mit freundlichen Grüßen
Branislav Ćirić
Brani Digitale Lösungen
📞 +49 [TELEFON] | ✉ ciricb1998@gmail.com`,
  },
]

const ICON_MAP = {
  user:      <User size={20} />,
  file:      <FileText size={20} />,
  refresh:   <ArrowsClockwise weight="fill" size={20} />,
  arrow:     <ArrowRight size={20} />,
  wrench:    <Wrench size={20} />,
  dollar:    <CurrencyDollar size={20} />,
  alert:     <WarningCircle weight="fill" size={20} />,
  handshake: <Star weight="fill" size={20} />,
}

export default function BDLEmailScreen() {
  const { t: appT, setScreen } = useApp()
  const [selected, setSelected] = useState(null)
  const [copied, setCopied] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editBody, setEditBody] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [vars, setVars] = useState({})

  const tmpl = selected ? TEMPLATES.find(x => x.id === selected) : null

  // Detect which vars exist in a template
  const activeVars = useMemo(() => {
    if (!tmpl) return []
    return tmpl.vars || []
  }, [tmpl])

  function applyVars(text) {
    let out = text
    if (!out) return out
    activeVars.forEach(v => {
      if (vars[v]) out = out.split(`[${v}]`).join(vars[v])
    })
    return out
  }

  function openTemplate(id) {
    const tmpl = TEMPLATES.find(x => x.id === id)
    setVars({})
    setEditMode(false)
    setEditBody(tmpl.body)
    setEditSubject(tmpl.subject)
    setSelected(id)
  }

  function startEdit() {
    setEditBody(applyVars(editBody))
    setEditSubject(applyVars(editSubject))
    setEditMode(true)
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(applyVars(text)).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const filledBody = editMode ? editBody : applyVars(editBody)
  const filledSubject = editMode ? editSubject : applyVars(editSubject)

  // ── TEMPLATE DETAIL ──────────────────────────────────────────────────────────
  if (tmpl) {
    return (
      <div className="screen fade-in">
        <div className="screen-header">
          <button
            onClick={() => { setSelected(null); setEditMode(false) }}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: '0 10px 0 0' }}
          >
            <CaretLeft size={16} /> Zurück
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: tmpl.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tmpl.color }}>
              {ICON_MAP[tmpl.icon]}
            </div>
            <div className="screen-title" style={{ fontSize: 16 }}>{tmpl.category}</div>
          </div>
          <button
            onClick={editMode ? () => setEditMode(false) : startEdit}
            style={{ background: editMode ? 'rgba(239,68,68,0.15)' : 'var(--accent-dim)', border: `1px solid ${editMode ? 'rgba(239,68,68,0.3)' : 'var(--accent)'}`, color: editMode ? '#ef4444' : 'var(--accent)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            {editMode ? <><X size={12} /> Abbrechen</> : <><PencilSimple size={12} /> Bearbeiten</>}
          </button>
        </div>

        {/* Platzhalter-Felder */}
        {activeVars.length > 0 && !editMode && (
          <div className="card" style={{ marginBottom: 12, background: 'linear-gradient(135deg,rgba(59,130,246,0.06),rgba(59,130,246,0.02))' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '1.5px', marginBottom: 10 }}>PLATZHALTER AUSFÜLLEN</div>
            <div style={{ display: 'grid', gridTemplateColumns: activeVars.length > 2 ? '1fr 1fr' : '1fr', gap: 8 }}>
              {activeVars.map(v => (
                <div key={v}>
                  <div style={{ fontSize: 9, color: 'var(--text-dimmer)', fontWeight: 700, letterSpacing: '1px', marginBottom: 3 }}>[{v}]</div>
                  <input
                    className="field-input"
                    style={{ fontSize: 12, padding: '7px 10px' }}
                    value={vars[v] || ''}
                    placeholder={v === 'NAME' ? 'Dr. Müller' : v === 'DATUM' ? 'tt.mm.jjjj' : v === 'BETRAG' ? '0,00' : v}
                    onChange={e => setVars(prev => ({ ...prev, [v]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Betreff */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dimmer)', letterSpacing: '1.5px', marginBottom: 6 }}>BETREFF</div>
        <div className="card" style={{ marginBottom: 12 }}>
          {editMode
            ? <textarea className="field-input" style={{ resize: 'none', fontSize: 12, padding: '8px 10px', minHeight: 48 }} value={editSubject} onChange={e => setEditSubject(e.target.value)} />
            : <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 }}>{filledSubject}</div>
          }
          <button
            className="btn btn-outline"
            style={{ marginTop: 8, width: '100%', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => copyText(editMode ? editSubject : tmpl.subject, 'subject')}
          >
            {copied === 'subject' ? <><Check size={13} /> Kopiert!</> : <><Copy size={13} /> Betreff kopieren</>}
          </button>
        </div>

        {/* E-Envelope Body */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dimmer)', letterSpacing: '1.5px', marginBottom: 6 }}>E-MAIL TEXT</div>
        <div className="card" style={{ marginBottom: 8 }}>
          {editMode
            ? <textarea
                className="field-input"
                style={{ resize: 'none', fontSize: 12, padding: '8px 10px', minHeight: 320, lineHeight: 1.7, fontFamily: 'inherit' }}
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
              />
            : <pre style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{filledBody}</pre>
          }
          <button
            className="btn btn-primary"
            style={{ marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => copyText(editMode ? editBody : tmpl.body, 'body')}
          >
            {copied === 'body' ? <><Check size={14} /> Kopiert!</> : <><Copy size={14} /> E-Envelope kopieren</>}
          </button>
        </div>

        {/* Aktionen */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            className="btn btn-outline"
            style={{ flex: 1, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => window.location.href = `mailto:?subject=${encodeURIComponent(filledSubject)}&body=${encodeURIComponent(filledBody)}`}
          >
            <Envelope weight="fill" size={14} /> Envelope App
          </button>
          <button
            className="btn btn-outline"
            style={{ flex: 1, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => { setScreen('bdl_composer') }}
          >
            <Lightning weight="fill" size={14} /> AI Composer
          </button>
        </div>
      </div>
    )
  }

  // ── TEMPLATE LISTE ───────────────────────────────────────────────────────────
  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">EMAIL</div>
          <div className="screen-title">E-Envelope-Vorlagen</div>
          <div className="screen-sub">Fertige E-Mails auf Deutsch</div>
        </div>
      </div>

      {/* Quick name replace */}
      <div className="field" style={{ marginBottom: 14 }}>
        <label className="field-label" style={{ letterSpacing: '1px' }}>SCHNELLERSETZUNG [NAME]</label>
        <input
          className="field-input"
          value={vars.NAME || ''}
          onChange={e => setVars(prev => ({ ...prev, NAME: e.target.value }))}
          placeholder="Dr. Müller"
        />
      </div>

      {TEMPLATES.map(tmpl => (
        <div
          key={tmpl.id}
          className="card"
          style={{ marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}
          onClick={() => openTemplate(tmpl.id)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 11, flexShrink: 0,
              background: tmpl.color + '18',
              border: `1px solid ${tmpl.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: tmpl.color,
            }}>
              {ICON_MAP[tmpl.icon]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{tmpl.category}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {(vars.NAME ? tmpl.subtitle.replace(/\[NAME\]/g, vars.NAME) : tmpl.subtitle)}
              </div>
            </div>
            <div style={{ fontSize: 18, color: 'var(--text-dimmer)', flexShrink: 0 }}>›</div>
          </div>
        </div>
      ))}

      {/* Hinweis */}
      <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--accent-dim)', border: '0.5px solid var(--accent)', borderRadius: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>Hinweis</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          Alle eckigen Klammern [NAME], [DATUM] usw. müssen durch konkrete Daten ersetzt werden. Verwende das Feld oben für schnellen [NAME]-Ersatz.
        </div>
      </div>
    </div>
  )
}
