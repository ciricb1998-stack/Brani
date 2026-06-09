import { useState } from 'react'

const BG = '#080808', C = '#0f0f0f', C2 = '#141414', BR = '#1a1a1a', TX = '#e8e8e8', DM = '#555', D2 = '#333'
const A = '#F97316'

const SECTIONS = [
  {
    id: 'tutorial',
    icon: '🎓',
    title: 'Tutorial — DT GmbH',
    subtitle: 'Schritt-für-Schritt Einführung',
    color: A,
    content: [
      {
        step: 1,
        title: 'Dashboard öffnen',
        body: `Tippe in der App auf "Mehr" (branip) → "DT GmbH". Du siehst sofort das Dashboard mit allen KPIs: offene Tickets, SLA-Status, kritische Fälle und heutige Aktivitäten.

Das Dashboard ist dein täglicher Startpunkt. Es zeigt dir in Sekunden, was sofort erledigt werden muss — rot = SLA verletzt, orange = Warnung, grün = alles OK.`,
      },
      {
        step: 2,
        title: 'Erstes Ticket erstellen',
        body: `Tabs: Tickets → "+ Ticket"

Pflichtfeld: Titel (Kurzbeschreibung des Problems)
Wichtig: Priorität korrekt setzen!
• Kritisch = System komplett ausgefallen, OP-Bereich betroffen
• Hoch = Abteilung eingeschränkt, kein Workaround
• Mittel = Einzelperson betroffen, Workaround möglich
• Niedrig = Kleinigkeit, keine Eile

Tipp: Gerät direkt beim Ticket verknüpfen (R-Nummer auswählen). So weißt du immer, welcher Rechner gemeint ist.`,
      },
      {
        step: 3,
        title: 'SLA-Timer verstehen',
        body: `Jedes offene Ticket hat einen SLA-Timer. Die Ampel zeigt:

🟢 Grün → noch genug Zeit
🟠 Orange → 75% der Zeit verbraucht, JETZT priorisieren
🔴 Rot / "SLA VERLETZT" → Eskalation nötig, sofort handeln

SLA-Zeiten je Priorität:
• Kritisch: 1h bis Lösung (15min bis Reaktion)
• Hoch: 8h bis Lösung (4h bis Reaktion)
• Mittel: 48h bis Lösung (8h bis Reaktion)
• Niedrig: 3 Tage bis Lösung (24h bis Reaktion)`,
      },
      {
        step: 4,
        title: 'Gerät inventarisieren',
        body: `Tabs: Geräte → "+ Gerät"

Jeder PC bekommt eine R-Nummer (R-0001, R-0002...). Dieses System nutzt du überall: im Ticket, im Gespräch mit dem Mentor, in Berichten.

Was du immer ausfüllen solltest:
• R-Nummer (kann auch manuell sein, z.B. PC-101)
• Gerätename (z.B. "PC-Radiologie-2")
• Benutzer (Name des Mitarbeiters)
• Standort (Zimmer-Nr., Abteilung)
• IP-Adresse (aus deinem Netzwerk-Scan)

Foto direkt aufnehmen: So dokumentierst du Aufkleber, Kabel, Schäden.`,
      },
      {
        step: 5,
        title: 'Wissensdatenbank nutzen',
        body: `Tabs: Wissen

Jedes gelöste Problem → sofort dokumentieren! Schema:
1. Was war das Problem? (Fehlermeldung, Symptom)
2. Was war die Lösung? (exakte Schritte)

Nach 2 Wochen hast du eine persönliche IT-Wissensdatenbank fürs Klinikum. Du löst Probleme 10x schneller.

Jeder Artikel kann "verifiziert" werden — das heißt: die Lösung wurde mehrfach bestätigt.
"Verwendet"-Zähler: wie oft du diesen Artikel nachgeschlagen hast.`,
      },
      {
        step: 6,
        title: 'Wartungskalender pflegen',
        body: `Tabs: Kalender → "+ Wartung planen"

Plane regelmäßige Aufgaben:
• Monatliche Windows-Updates (Software-Update)
• Quartalsweise Backup-Checks
• Druckerpatronen, Reinigung
• Netzwerk-Checkups

Status: Geplant → In Durchführung → Erledigt
Erledigte Wartungen werden im Verlauf gespeichert.

Tipp: Plane am Anfang der Woche alles vor — dann siehst du direkt, was ansteht.`,
      },
      {
        step: 7,
        title: 'Schichtbericht & Mentor-Link',
        body: `Tabs: Bericht

Am Ende jeder Schicht:
1. Schichtnotizen ausfüllen (Übergabe-Infos)
2. PDF exportieren → sauberer Servicebericht mit BRANI+ Branding
3. Mentor-Link generieren → dein Mentor sieht alles ohne Login

Der PDF-Bericht enthält: alle Tickets mit SLA-Status, Geräte-Inventar, Wiki-Statistik, Schichtnotizen. Perfekt für Meetings oder E-Mail-Anhang.

Der Mentor-Link ist ein read-only Snapshot — kein Passwort, kein Login. Einfach Link schicken.`,
      },
    ],
  },
  {
    id: 'faq',
    icon: '❓',
    title: 'Häufige Fragen (FAQ)',
    subtitle: 'Schnelle Antworten',
    color: '#3B82F6',
    content: [
      {
        q: 'Werden meine Daten automatisch gespeichert?',
        a: 'Ja. Jede Änderung wird sofort lokal gespeichert (localStorage) und im Hintergrund mit Supabase synchronisiert. Du verlierst keine Daten, auch wenn du offline bist.',
      },
      {
        q: 'Warum sehe ich manchmal kurze Sync-Verzögerungen?',
        a: 'Der Supabase-Server steht in Paris (EU-West). Alle Daten werden erst lokal gespeichert, dann synchronisiert — du merkst davon praktisch nichts. Die App funktioniert vollständig offline.',
      },
      {
        q: 'Was passiert, wenn ich ein Ticket auf "Erledigt" setze?',
        a: 'Die SLA-Uhr stoppt. Der Zeitstempel der Lösung wird automatisch gesetzt. Das Ticket bleibt im System und erscheint im Schichtbericht.',
      },
      {
        q: 'Kann mein Mentor Daten ändern?',
        a: 'Nein. Der Mentor-Link ist read-only. Er sieht einen Snapshot der Daten zum Zeitpunkt der Link-Generierung. Keine Bearbeitungsmöglichkeit.',
      },
      {
        q: 'Wie viele Fotos kann ich pro Ticket/Gerät speichern?',
        a: 'Bis zu 6 Fotos pro Ticket und Gerät. Fotos werden komprimiert (max. 1000px, 72% JPEG-Qualität) und lokal gespeichert. Sie werden NICHT zu Supabase synchronisiert — das spart Speicher und Bandbreite.',
      },
      {
        q: 'Wie exportiere ich einen PDF-Bericht?',
        a: 'Bericht-Tab → "PDF Exportieren". Der Bericht enthält alle Tickets, Geräte, Wiki-Artikel und deine Schichtnotizen. Er wird direkt als Datei heruntergeladen.',
      },
      {
        q: 'Was bedeutet SLA-Breach?',
        a: 'Das SLA (Service Level Agreement) wurde verletzt — die maximale Lösungszeit für die Ticket-Priorität ist überschritten. Kritisch: nach 1h. Hoch: nach 8h. Mittel: nach 48h. Sofort eskalieren!',
      },
      {
        q: 'Kann ich DT GmbH vom Desktop nutzen?',
        a: 'Ja. Die App ist responsive und funktioniert auf Desktop und Mobile. Auf dem Desktop siehst du eine Sidebar-Navigation.',
      },
    ],
  },
  {
    id: 'sop_app',
    icon: '📱',
    title: 'SOP — BRANI+ App',
    subtitle: 'Standard Operating Procedure — Applikation',
    color: '#A855F7',
    content: `**Version:** 1.0 · **Stand:** Juni 2026 · **Erstellt von:** Branislav Ćirić

---

## 1. Zweck und Geltungsbereich

Diese SOP beschreibt die standardisierte Nutzung der BRANI+ App für den täglichen IT-Support-Workflow bei DT GmbH / Klinikum München. Sie gilt für alle L1/L2-Techniker, die mit der App arbeiten.

---

## 2. Systemanforderungen

• **Gerät:** Smartphone (iOS 16+ / Android 10+) oder Desktop-Browser
• **App:** brani-system.vercel.app — als PWA installieren (Browser → "Zum Startbildschirm hinzufügen")
• **Internet:** Nur beim Start und für Sync nötig — Offline-Betrieb möglich
• **Login:** Supabase-Konto (E-Mail + Passwort)

---

## 3. Täglicher Start-Ablauf

**Schritt 1 — App öffnen**
• App starten → einloggen → branip-Bereich auswählen
• "Mehr" → "DT GmbH" antippen

**Schritt 2 — Dashboard prüfen**
• Rote SLA-Badges sofort priorisieren
• Kritische Tickets zuerst bearbeiten
• Aktuelle offene Tickets überfliegen

**Schritt 3 — Status aktualisieren**
• Gestrige In-Progress-Tickets: Status auf "Erledigt" oder "Wartend" setzen
• Neue Meldungen von der Übergabe als Tickets anlegen

---

## 4. Ticket-Lebenszyklus

Offen → In Bearbeitung → [Wartend] → Erledigt
                        ↓
                    Eskaliert (wenn SLA verletzt)

**Statusregeln:**
• "Offen" = neu eingegangen, noch kein Techniker zugewiesen
• "In Bearbeitung" = Techniker aktiv daran
• "Wartend" = wartet auf Lieferung, Rückmeldung, Freigabe
• "Eskaliert" = L2/L3 wurde einbezogen oder SLA verletzt
• "Erledigt" = Problem gelöst, Lösung dokumentiert

---

## 5. Datensicherung

• Alle Daten werden lokal in localStorage gehalten
• Automatische Supabase-Synchronisation im Hintergrund
• Fotos bleiben nur lokal (werden nicht synchronisiert)
• Bei Gerätewechsel: Login → alle Daten werden automatisch synchronisiert

---

## 6. Fehlerbehandlung

**App startet nicht:**
1. Browser-Cache leeren
2. Neu laden (Strg+Shift+R)
3. Service Worker deregistrieren (DevTools → Application → Service Workers)

**Sync funktioniert nicht:**
1. Internetverbindung prüfen
2. Supabase-Status: status.supabase.com
3. Lokale Daten bleiben erhalten — kein Datenverlust

**PDF-Export schlägt fehl:**
1. Pop-up-Blocker deaktivieren
2. Browser-Download-Berechtigung erlauben
`,
  },
  {
    id: 'sop_workflow',
    icon: '🏥',
    title: 'SOP — IT-Workflow Klinikum',
    subtitle: 'Standard Operating Procedure — Täglicher L1/L2 Support',
    color: '#22C55E',
    content: `**Version:** 1.0 · **Stand:** Juni 2026 · **Gültig für:** IT-Support L1/L2 · Klinikum München

---

## 1. Schichtbeginn (täglich)

**1.1 Übergabe lesen**
• Übergabenotizen der vorherigen Schicht im Bericht-Tab lesen
• Offene Tickets mit hoher Priorität identifizieren
• SLA-Status auf Dashboard prüfen

**1.2 Ausrüstung prüfen**
• Laptop funktionsfähig, geladen
• Ticket-System (BRANI+ App) geöffnet
• Netzwerkzugang funktioniert

---

## 2. Meldungseingang — L1 Erstreaktion

**2.1 Anfnahme (Ticketerstellung)**
1. Benutzer meldet Problem (telefonisch, persönlich, E-Mail)
2. Sofort Ticket erstellen: Titel, Beschreibung, Priorität
3. Gerät verknüpfen (R-Nummer suchen)
4. Status → "In Bearbeitung", Bearbeiter → eigener Name

**2.2 Erste Diagnose (vor Ort oder remote)**
• Was genau passiert? (Fehlermeldung abfotografieren → ans Ticket hängen)
• Seit wann? Immer oder plötzlich?
• Nur bei diesem Benutzer oder mehreren?
• Zuletzt etwas geändert? (Update, neues Gerät, Passwortwechsel)

**2.3 Wissensdatenbank prüfen**
• Im Wissen-Tab nach ähnlichem Problem suchen
• Wenn Lösung vorhanden → ausführen → Ticket schließen → Wiki-Hit zählt

---

## 3. L1 Lösungsversuche (max. 30-45 min)

**Hardware:**
□ Neustart versucht?
□ Kabel/Verbindung geprüft?
□ Am anderen Port versucht?
□ Anderes Gerät testen?

**Software:**
□ Prozess neu starten?
□ Als Administrator ausführen?
□ Virenscanner-Quarantäne prüfen?
□ Event Viewer (Windows) → Fehler notiert?

**Netzwerk:**
□ IP-Adresse vorhanden? (ipconfig)
□ Gateway pingbar?
□ DNS auflösbar?
□ Proxy-Einstellungen korrekt?

---

## 4. Eskalation zu L2

**Eskalieren wenn:**
• L1-Maßnahmen nach 30-45 min nicht erfolgreich
• Server/Datenbank/Kritische Infrastruktur betroffen
• Sicherheitsvorfall vermutet (Virus, Datenverlust, unbefugter Zugriff)
• SLA-Breach droht (orange Badge im Dashboard)

**Eskalationsschritte:**
1. Ticket-Status → "Eskaliert"
2. Bisherige Schritte im Ticket dokumentieren
3. L2-Kollegen oder Vorgesetzen informieren
4. Benutzer über Eskalation informieren

---

## 5. Neue Geräte einrichten

1. Gerät in App anlegen (R-Nummer vergeben, Foto aufnehmen)
2. Netzwerk-Konfiguration (IP, Hostname, Domäne)
3. Windows-Updates durchführen
4. Antivirensoftware installieren/aktualisieren
5. Druckerzugang einrichten
6. Benutzerkonto prüfen (AD/Lokales Konto)
7. Gerät an Benutzer übergeben + kurze Einweisung
8. Status in App → "Aktiv"

---

## 6. Sicherheit & Compliance (NIS2 / DSGVO)

**DSGVO-Relevant:**
• Patientendaten NIE in Ticket-Beschreibungen eintragen
• Screenshots von Patientenbildschirmen nur mit Genehmigung
• Gerätedaten (IP, Name, Standort) dürfen dokumentiert werden

**NIS2-Anforderungen:**
• Sicherheitsvorfälle sofort eskalieren (max. 24h Meldefrist)
• Netzwerkanomalien dokumentieren
• Passwortänderungen nach Vorfällen erzwingen

---

## 7. Schichtende

**7.1 Dokumentation abschließen**
□ Alle bearbeiteten Tickets auf korrekten Status setzen
□ Erledigte Tickets: Lösung eingetragen?
□ Offene Tickets: Aktueller Stand dokumentiert?

**7.2 Schichtbericht erstellen (BRANI+ App)**
1. Bericht-Tab öffnen
2. Schichtnotizen ausfüllen (wichtige Punkte für Übergabe)
3. PDF exportieren (für Archiv / Mentor)
4. Bei Bedarf: Mentor-Link generieren und senden

**7.3 Übergabe**
• Offene kritische Tickets mündlich übergeben
• Laufende Reparaturen / Bestellungen kommunizieren
• Besonderheiten notieren (Serverraum-Zugang offen, Gerät beim Lieferanten etc.)
`,
  },
  {
    id: 'nis2',
    icon: '🔒',
    title: 'NIS2 & DSGVO — Checkliste',
    subtitle: 'Pflichten im Klinikum-IT-Betrieb',
    color: '#EF4444',
    content: [
      { head: 'NIS2 — Meldepflichten', items: ['Sicherheitsvorfall → 24h Erstmeldung an BSI', 'Vollständige Meldung innerhalb 72h', 'Abschlussbericht innerhalb 1 Monat', 'Vorfälle immer dokumentieren (BRANI+ Ticket)'] },
      { head: 'NIS2 — Technische Maßnahmen', items: ['Netzwerksegmentierung (Patientennetz getrennt)', 'Regelmäßige Software-Updates (Wartungskalender!)', 'Backup-Checks quartalsmäßig', 'Zugangskontrollen geprüft', 'Antivirensoftware aktuell'] },
      { head: 'DSGVO — Verbote', items: ['KEINE Patientendaten in Tickets/Beschreibungen', 'KEINE Screenshots mit Patientendaten speichern', 'Geräte-Logs nur nach Genehmigung einsehen', 'Keine privaten USB-Sticks an Klinik-PCs'] },
      { head: 'DSGVO — Erlaubt & dokumentieren', items: ['Gerätedaten (IP, Hostname, Standort) dokumentieren', 'Techniker-Name im Ticket erfassen', 'Zugriffe auf Systeme protokollieren', 'Wartungsarbeiten im Kalender dokumentieren'] },
      { head: 'Im Notfall', items: ['Sicherheitsvorfall: IT-Leitung + Datenschutzbeauftragten informieren', 'Gerät sofort vom Netz trennen (Stecker)', 'Nichts löschen — Beweise sichern', 'Ticket mit Status "Eskaliert" anlegen'] },
    ],
  },
]

function Accordion({ title, subtitle, icon, color, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: C, border: `1px solid ${open ? color + '40' : BR}`, borderRadius: 14, marginBottom: 10, overflow: 'hidden', transition: 'border .2s' }}>
      <div onClick={() => setOpen(p => !p)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: TX }}>{title}</div>
          <div style={{ fontSize: 9, color: DM, marginTop: 2 }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 16, color: DM, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</div>
      </div>
      {open && <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${BR}` }}>{children}</div>}
    </div>
  )
}

function StepCard({ step, title, body }) {
  return (
    <div style={{ marginTop: 14, background: C2, borderRadius: 11, padding: '12px 14px', borderLeft: `3px solid ${A}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: A, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{step}</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: TX }}>{title}</div>
      </div>
      <div style={{ fontSize: 11, color: '#999', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{body}</div>
    </div>
  )
}

function SopContent({ text }) {
  return (
    <div style={{ marginTop: 12 }}>
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return <div key={i} style={{ fontSize: 11, fontWeight: 800, color: A, letterSpacing: '0.5px', marginTop: 14, marginBottom: 4 }}>{line.replace('## ', '')}</div>
        if (line.startsWith('**') && line.endsWith('**')) return <div key={i} style={{ fontSize: 10, fontWeight: 700, color: TX, marginTop: 10 }}>{line.replace(/\*\*/g, '')}</div>
        if (line.startsWith('---')) return <div key={i} style={{ borderTop: `1px solid ${D2}`, marginTop: 12, marginBottom: 12 }} />
        if (line.startsWith('□ ')) return <div key={i} style={{ fontSize: 11, color: '#999', lineHeight: 1.8, paddingLeft: 12 }}>☐ {line.slice(2)}</div>
        if (line.startsWith('• ')) return <div key={i} style={{ fontSize: 11, color: '#999', lineHeight: 1.8, paddingLeft: 12 }}>• {line.slice(2)}</div>
        if (/^\d+\. /.test(line)) return <div key={i} style={{ fontSize: 11, color: '#999', lineHeight: 1.8, paddingLeft: 12 }}>{line}</div>
        if (line.startsWith('```') || line.endsWith('```')) return null
        if (line.trim() === '') return <div key={i} style={{ height: 4 }} />
        return <div key={i} style={{ fontSize: 11, color: '#999', lineHeight: 1.75 }}>{line}</div>
      })}
    </div>
  )
}

export default function HilfeScreen() {
  const [search, setSearch] = useState('')

  return (
    <div style={{ minHeight: '100%', background: BG, color: TX, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: C, borderBottom: `1px solid ${BR}`, paddingTop: 'env(safe-area-inset-top, 0px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ padding: '14px 15px 13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg, ${A}, #EA580C)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📖</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: TX }}>Hilfe & Dokumentation</div>
              <div style={{ fontSize: 8, color: DM, letterSpacing: '1px', fontWeight: 600 }}>TUTORIAL · FAQ · SOP · NIS2/DSGVO</div>
            </div>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Suchen in der Dokumentation..." style={{ width: '100%', background: C2, border: `1px solid ${BR}`, borderRadius: 10, color: TX, fontFamily: 'inherit', fontSize: 12, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ padding: '13px 13px calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
        {SECTIONS.map(sec => {
          const match = !search || [sec.title, sec.subtitle].join(' ').toLowerCase().includes(search.toLowerCase())
          if (!match) return null
          return (
            <Accordion key={sec.id} title={sec.title} subtitle={sec.subtitle} icon={sec.icon} color={sec.color}>
              {/* Tutorial — steps */}
              {sec.id === 'tutorial' && sec.content.map(s => <StepCard key={s.step} {...s} />)}

              {/* FAQ */}
              {sec.id === 'faq' && sec.content.map((f, i) => (
                <div key={i} style={{ marginTop: 12, background: C2, borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: TX, marginBottom: 5 }}>❓ {f.q}</div>
                  <div style={{ fontSize: 11, color: '#888', lineHeight: 1.7 }}>{f.a}</div>
                </div>
              ))}

              {/* SOP texts */}
              {(sec.id === 'sop_app' || sec.id === 'sop_workflow') && typeof sec.content === 'string' && <SopContent text={sec.content} />}

              {/* NIS2 checklist */}
              {sec.id === 'nis2' && sec.content.map((g, i) => (
                <div key={i} style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', letterSpacing: '1px', marginBottom: 6 }}>{g.head.toUpperCase()}</div>
                  {g.items.map((item, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: `1px solid ${D2}`, alignItems: 'flex-start' }}>
                      <span style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }}>•</span>
                      <span style={{ fontSize: 11, color: '#999', lineHeight: 1.6 }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </Accordion>
          )
        })}

        {/* Quick tips */}
        <div style={{ background: C, border: `1px solid ${BR}`, borderRadius: 14, padding: '14px 16px', marginTop: 4 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: DM, letterSpacing: '1.5px', marginBottom: 10 }}>QUICK TIPS — TÄGLICH</div>
          {[
            ['Schichtbeginn', '1. Dashboard öffnen → 2. Rote Tickets priorisieren → 3. Status aktualisieren'],
            ['Neues Problem', '1. Ticket erstellen → 2. Priorität setzen → 3. Gerät verknüpfen → 4. Foto aufnehmen'],
            ['Problem gelöst', '1. Status → Erledigt → 2. Lösung dokumentieren → 3. Wiki-Artikel erstellen'],
            ['Schichtende', '1. Alle Tickets aktualisieren → 2. Schichtnotizen → 3. PDF exportieren'],
            ['Mentor informieren', 'Bericht-Tab → Mentor-Link generieren → Link per WhatsApp/E-Mail senden'],
          ].map(([t, s]) => (
            <div key={t} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: `1px solid ${D2}` }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: A, flexShrink: 0, minWidth: 70, lineHeight: 1.6 }}>{t}</span>
              <span style={{ fontSize: 10, color: '#888', lineHeight: 1.6 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
