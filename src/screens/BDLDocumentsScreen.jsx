import { useState } from 'react'
import { useApp } from '../App.jsx'
import {
  CaretLeft, DownloadSimple, Shield, FileDashed, WarningCircle, FileText,
  Envelope, Monitor, ClipboardText, Wrench, Lock, Gauge, CreditCard, GraduationCap,
} from '@phosphor-icons/react'
import { jsPDF } from 'jspdf'
import { loadInvoiceSettings } from '../utils/invoiceStorage.js'

const p = str => (str == null ? '' : String(str))
  .replace(/Ć/g, 'C').replace(/ć/g, 'c')
  .replace(/Č/g, 'C').replace(/č/g, 'c')
  .replace(/Š/g, 'S').replace(/š/g, 's')
  .replace(/Ž/g, 'Z').replace(/ž/g, 'z')
  .replace(/Đ/g, 'D').replace(/đ/g, 'd')

const W     = 210
const H     = 297
const NAVY  = [8,   22,  52]
const NAVY2 = [14,  34,  75]
const DARK  = [15,  23,  42]
const MID   = [60,  72,  90]
const MUTED = [110, 124, 145]
const DIM_W = [155, 170, 198]
const LIGHT = [247, 249, 253]
const WHITE = [255, 255, 255]

const SERVICES_LIST = [
  { key: 'it_infra',   label: 'IT-Infrastruktur, Netzwerk & Administration' },
  { key: 'cyber',      label: 'Cybersicherheit & NIS2-Compliance' },
  { key: 'dsgvo_b',    label: 'DSGVO & Datenschutzberatung' },
  { key: 'support',    label: 'Gerätewartung, -installation & Hardware-Support' },
  { key: 'helpdesk',   label: 'Helpdesk & IT-Support (Ticketsystem via Slack)' },
  { key: 'backup',     label: 'Datensicherung & Backup-Management' },
  { key: 'cloud',      label: 'Cloud-Dienste & Microsoft 365 Administration' },
  { key: 'automation', label: 'Digitalisierung & Prozessautomatisierung' },
  { key: 'web',        label: 'Web- & App-Entwicklung' },
  { key: 'ai',         label: 'KI-Beratung & Implementierung' },
  { key: 'security',   label: 'Netzwerksicherheit & Firewall-Management' },
  { key: 'software',   label: 'Softwarelizenz- & Updatemanagement' },
  { key: 'archiv',     label: 'Digitale Archivierung & Dokumentationsmanagement' },
  { key: 'tom',        label: 'TOM-Erstellung & Datenschutz-Dokumentation (Art. 32 DSGVO)' },
  { key: 'aiact',      label: 'AI Act Compliance Beratung & Implementierung' },
  { key: 'schulung',   label: 'IT-Schulungen & Mitarbeiterschulungen' },
]

// ══════════════════════════════════════════════════════════════════════════════
// Shared PDF helpers
// ══════════════════════════════════════════════════════════════════════════════

function docHeader(pdf, accent, bigTitle, badgeLabel, metaLines) {
  const s = loadInvoiceSettings()
  const headerH = 68
  pdf.setFillColor(...NAVY)
  pdf.rect(0, 0, W, headerH, 'F')
  pdf.setFillColor(15, 32, 68)
  pdf.rect(0, 0, W, 2, 'F')
  const lx = 14, ly = 14, ls = 28
  if (s.logo) {
    try {
      pdf.addImage(s.logo, s.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG', lx, ly, ls, ls)
    } catch {}
  } else {
    pdf.setFillColor(...accent)
    pdf.roundedRect(lx, ly, ls, ls, 5, 5, 'F')
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor(...WHITE)
    pdf.text(p(s.ownerName || 'BC').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase(), lx + ls / 2, ly + ls / 2 + 4.5, { align: 'center' })
  }
  const ix = 46
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(...WHITE)
  pdf.text(p(s.companyName || 'Brani Digitale Losungen'), ix, 23)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(...DIM_W)
  ;[p(s.ownerName || 'Branislav Ciric'), s.email || 'contact@branislavciric.com', [s.phone, s.website].filter(Boolean).join('  ·  ') || 'www.branislavciric.com'].forEach((l, i) => pdf.text(l, ix, 30 + i * 5))
  const rX = W - 14
  const titleLines = bigTitle.split('\n')
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20); pdf.setTextColor(...WHITE)
  if (titleLines.length === 2) { pdf.text(titleLines[0], rX, 21, { align: 'right' }); pdf.text(titleLines[1], rX, 30, { align: 'right' }) }
  else pdf.text(bigTitle, rX, 26, { align: 'right' })
  const bY = titleLines.length === 2 ? 35 : 32, bW = 72
  pdf.setFillColor(...accent); pdf.roundedRect(rX - bW, bY, bW, 7, 2, 2, 'F')
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(...WHITE)
  pdf.text(badgeLabel, rX - bW / 2, bY + 4.8, { align: 'center' })
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(...DIM_W)
  metaLines.forEach((m, i) => pdf.text(p(m), rX, bY + 12 + i * 5.5, { align: 'right' }))
  pdf.setFillColor(...accent); pdf.rect(0, headerH - 2, W, 2, 'F')
  return headerH + 10
}

function docPage2Header(pdf, accent) {
  const s = loadInvoiceSettings()
  pdf.setFillColor(...NAVY); pdf.rect(0, 0, W, 10, 'F')
  pdf.setFillColor(...accent); pdf.rect(0, 10, W, 1.5, 'F')
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...DIM_W)
  pdf.text(p(s.companyName || 'Brani Digitale Losungen'), 14, 7.5)
  return 18
}

function docFooter(pdf, pageNum, totalPages) {
  const s = loadInvoiceSettings()
  const footerH = 24
  pdf.setFillColor(...NAVY2); pdf.rect(0, H - footerH, W, footerH, 'F')
  pdf.setFillColor(59, 130, 246); pdf.rect(0, H - footerH, W, 1.5, 'F')
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...WHITE)
  pdf.text([p(s.companyName || 'Brani Digitale Losungen'), p(s.ownerName || 'Branislav Ciric')].join('   ·   '), W / 2, H - footerH + 9, { align: 'center' })
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(...DIM_W)
  pdf.text([s.iban ? `IBAN: ${p(s.iban)}` : null, s.bic ? `BIC: ${s.bic}` : null, s.email || 'contact@branislavciric.com', s.website || 'www.branislavciric.com'].filter(Boolean).join('   ·   '), W / 2, H - footerH + 17, { align: 'center' })
  pdf.setFontSize(6); pdf.setTextColor(70, 95, 140)
  pdf.text(`${pageNum} / ${totalPages}`, W - 14, H - footerH + 13, { align: 'right' })
}

function section(pdf, y, title, accent, items) {
  pdf.setFillColor(...accent); pdf.rect(14, y - 5, 3, 7, 'F')
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...accent)
  pdf.text(title, 20, y)
  pdf.setDrawColor(...accent); pdf.setLineWidth(0.25); pdf.line(20, y + 1.5, W - 14, y + 1.5)
  y += 8
  items.forEach(item => {
    if (item.heading) {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(...DARK)
      pdf.text(p(item.heading), 14, y); y += 5.5; return
    }
    if (item.body) {
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...MID)
      const lines = pdf.splitTextToSize(p(item.body), W - 28)
      lines.forEach(l => { pdf.text(l, 14, y); y += 4.5 }); y += 1.5; return
    }
    if (item.check !== undefined) {
      if (item.check) {
        pdf.setFillColor(...accent); pdf.rect(14, y - 4, 4.5, 4.5, 'F')
        pdf.setDrawColor(...WHITE); pdf.setLineWidth(0.8)
        pdf.line(15, y - 1.5, 16, y - 0.3); pdf.line(16, y - 0.3, 18, y - 3.5)
      } else {
        pdf.setDrawColor(180, 194, 218); pdf.setLineWidth(0.45); pdf.rect(14, y - 4, 4.5, 4.5, 'S')
      }
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...MID)
      const ll = pdf.splitTextToSize(p(item.label || ''), W - 32)
      ll.forEach((l, li) => { pdf.text(l, 21, y - 0.5 + li * 4.5) })
      y += Math.max(5.5, ll.length * 4.5 + 1); return
    }
  })
  return y + 4
}

function signatureBlock(pdf, y, left, right) {
  const ly = y + 10
  pdf.setDrawColor(180, 194, 218); pdf.setLineWidth(0.4)
  pdf.line(14, ly, 90, ly)
  if (right) pdf.line(110, ly, W - 14, ly)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(...MUTED)
  pdf.text(p(left), 14, ly + 5)
  if (right) pdf.text(p(right), 110, ly + 5)
  return ly + 10
}

function drawTable(pdf, y, headers, rows, colWidths, accent) {
  const x = 14, rowH = 8
  const totalW = colWidths.reduce((a, b) => a + b, 0)
  pdf.setFillColor(...accent); pdf.rect(x, y, totalW, rowH, 'F')
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(...WHITE)
  let cx = x + 2
  headers.forEach((h, i) => { pdf.text(p(h), cx, y + 5.5); cx += colWidths[i] })
  y += rowH
  rows.forEach((row, ri) => {
    if (ri % 2 === 1) { pdf.setFillColor(...LIGHT); pdf.rect(x, y, totalW, rowH, 'F') }
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(...MID)
    cx = x + 2
    row.forEach((cell, i) => { pdf.text(p(String(cell || '')), cx, y + 5.5); cx += colWidths[i] })
    pdf.setDrawColor(220, 228, 240); pdf.setLineWidth(0.2); pdf.line(x, y + rowH, x + totalW, y + rowH)
    y += rowH
  })
  pdf.setDrawColor(...accent); pdf.setLineWidth(0.4)
  pdf.rect(x, y - rowH * rows.length - rowH, totalW, rowH * (rows.length + 1), 'S')
  return y + 5
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. IT-Dienstleistungsvertrag
// ══════════════════════════════════════════════════════════════════════════════
function generateDienstleistungsvertrag(v) {
  const s = loadInvoiceSettings()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const INDIGO = [79, 70, 229]
  const own = { name: p(s.companyName || 'Brani Digitale Losungen'), owner: p(s.ownerName || 'Branislav Ciric'), street: 'Bahnstrasse 3', city: '82131 Stockdorf', email: s.email || 'contact@branislavciric.com', web: s.website || 'www.branislavciric.com', tax: s.taxNumber ? `Steuernummer: ${s.taxNumber}` : 'Steuernummer: [wird nachgereicht]' }
  const dateStr  = v.date      ? new Date(v.date).toLocaleDateString('de-DE')      : new Date().toLocaleDateString('de-DE')
  const startStr = v.startDate ? new Date(v.startDate).toLocaleDateString('de-DE') : '[Vertragsbeginn]'
  const selectedServices = Array.isArray(v.services) ? v.services : []
  const serviceLabels = selectedServices.map(key => SERVICES_LIST.find(sv => sv.key === key)?.label).filter(Boolean)
  const hasPausch = v.pauschal && parseFloat(v.pauschal) > 0
  const hasHourly = v.hourlyRate && parseFloat(v.hourlyRate) > 0
  let payDesc
  if (hasPausch && hasHourly) payDesc = `Monatliche Pauschale von ${v.pauschal} €/Monat für die Grundversorgung. Zusatzleistungen: ${v.hourlyRate} €/Std. (zzgl. MwSt.).`
  else if (hasPausch) payDesc = `Monatliche Pauschale von ${v.pauschal} €/Monat (zzgl. MwSt.), abgerechnet zum Monatsletzten.`
  else if (hasHourly) payDesc = `Abrechnung nach Zeitaufwand, Stundensatz ${v.hourlyRate} €/Std. (zzgl. MwSt.). Monatliche Rechnungsstellung.`
  else payDesc = 'Die Vergütung wird individuell im Angebot oder Einzelauftrag schriftlich vereinbart.'

  pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  let y = docHeader(pdf, INDIGO, 'IT-DIENST-\nLEISTUNGSVERTRAG', 'IT-Services · Digitalisierung · Gesundheitswesen', [`Datum: ${dateStr}`, p(v.clientName || '')])
  y = section(pdf, y, 'Vertragsparteien', INDIGO, [
    { heading: 'Auftraggeber:' },
    { body: `${p(v.clientName || '[Praxis / Unternehmen]')}, ${p(v.clientStreet || '[Strasse]')}, ${p(v.clientCity || '[PLZ Stadt]')}` },
    { body: `Vertreten durch: ${p(v.doctorName || '[Name]')}${v.clientEmail ? `   |   E-Envelope: ${v.clientEmail}` : ''}` },
    { heading: 'Auftragnehmer:' },
    { body: `${own.name}, Inhaber: ${own.owner}` },
    { body: `${own.street}, ${own.city}   |   ${own.email}   |   ${own.web}` },
    { body: own.tax },
  ])
  y = section(pdf, y, '§ 1  Vertragsgegenstand', INDIGO, [
    { body: 'Der Auftragnehmer erbringt für den Auftraggeber IT-Dienstleistungen im Bereich der digitalen Infrastruktur, IT-Sicherheit und Digitalisierung, insbesondere für Einrichtungen im Gesundheitswesen.' },
    { body: `Vertragsbeginn: ${startStr}. Dieser Vertrag gilt als Rahmenvertrag für alle erbrachten Leistungen.` },
  ])
  const serviceItems = serviceLabels.length > 0
    ? [{ body: 'Vereinbarte Leistungsbereiche:' }, ...serviceLabels.map(lbl => ({ body: `•  ${lbl}` })), { body: 'Leistungen außerhalb dieses Umfangs werden gesondert angeboten und schriftlich vereinbart.' }]
    : [{ body: 'Der konkrete Leistungsumfang wird in gesonderten Angeboten oder Projektvereinbarungen schriftlich festgelegt.' }]
  y = section(pdf, y, '§ 2  Leistungsumfang', INDIGO, serviceItems)
  docFooter(pdf, 1, 3)

  pdf.addPage(); pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  y = docPage2Header(pdf, INDIGO)
  y = section(pdf, y, '§ 3  Vergütung und Zahlungsbedingungen', INDIGO, [
    { body: `3.1  Vergütung: ${payDesc}` },
    { body: '3.2  Zahlungsziel: Rechnungen sind innerhalb von 14 Tagen nach Rechnungsdatum ohne Abzug zu begleichen.' },
    { body: '3.3  Verzugszinsen: Bei Verzug werden Zinsen gemäß § 288 Abs. 2 BGB (9 Pp. über Basiszinssatz) sowie 15,00 € Mahngebühr pro Mahnung berechnet.' },
    { body: '3.4  Preisanpassung: Preise können mit 6 Wochen Vorankündigung angepasst werden. Bei Erhöhung >10 % besteht Sonderkündigungsrecht.' },
  ])
  y = section(pdf, y, '§ 4  Leistungszeit, Erreichbarkeit und Reaktionszeiten', INDIGO, [
    { body: '4.1  Reguläre Arbeitszeiten: Montag bis Freitag, 09:00–18:00 Uhr (außer gesetzliche Feiertage in Bayern).' },
    { body: '4.2  Wochenende / Feiertage: Erreichbarkeit per E-Envelope und Slack. Reaktion am nächsten Werktag; bei kritischen Ausfällen nach Möglichkeit früher.' },
    { body: '4.3  Reaktionszeit bei kritischen Störungen: 4–6 Stunden (Mo–Fr 09–18 Uhr). Kritisch = wesentliches IT-System vollständig ausgefallen.' },
    { body: '4.4  Kommunikation: Jeder Auftraggeber erhält Zugang zu einem dedizierten Slack-Kanal.' },
  ])
  y = section(pdf, y, '§ 5  Mitwirkungspflichten des Auftraggebers', INDIGO, [
    { body: '•  Bereitstellung aller erforderlichen Zugangsdaten und Netzwerkzugänge rechtzeitig vor Leistungsbeginn.' },
    { body: '•  Benennung einer verbindlichen Ansprechperson mit Entscheidungsbefugnis.' },
    { body: '•  Unverzügliche Information über geplante System- oder Softwareänderungen.' },
    { body: '•  Sicherstellung einer geeigneten Arbeitsumgebung bei Vor-Ort-Einsätzen.' },
    { body: '•  Regelmäßige Datensicherung der eigenen Systeme. Keine Haftung des Auftragnehmers für Verluste ohne Backup.' },
  ])
  y = section(pdf, y, '§ 6  Datenschutz und Vertraulichkeit', INDIGO, [
    { body: '6.1  DSGVO: Beide Parteien verarbeiten personenbezogene Daten ausschließlich gemäß DSGVO und nationalen Datenschutzgesetzen.' },
    { body: '6.2  AV-Vertrag: Bei Zugang zu Patientendaten wird ein gesonderter Auftragsverarbeitungsvertrag (Art. 28 DSGVO) abgeschlossen.' },
    { body: '6.3  Vertraulichkeit: Alle vertraulichen Informationen — insbesondere Patientendaten, Zugangsdaten, Geschäftsgeheimnisse — sind dauerhaft geheim zu halten.' },
  ])
  docFooter(pdf, 2, 3)

  pdf.addPage(); pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  y = docPage2Header(pdf, INDIGO)
  y = section(pdf, y, '§ 7  Haftung und Haftungsbeschränkung', INDIGO, [
    { body: '7.1  Unbeschränkte Haftung bei Vorsatz und grober Fahrlässigkeit.' },
    { body: '7.2  Bei leichter Fahrlässigkeit: Haftung nur bei Kardinalpflichtverletzung, begrenzt auf vorhersehbaren Schaden.' },
    { body: '7.3  Keine Haftung für Datenverluste ohne ausreichende Datensicherung durch den Auftraggeber.' },
    { body: '7.4  Keine Haftung für Schäden durch Cyberangriffe, Ransomware oder höhere Gewalt bei zumutbaren Schutzmaßnahmen.' },
    { body: '7.5  Keine Haftung für Fehler in Drittanbieter-Software (OS, ERP, Praxissoftware).' },
  ])
  y = section(pdf, y, '§ 8  Gewährleistung', INDIGO, [
    { body: '8.1  Mängel an eigenen Leistungen werden nach Anzeige innerhalb angemessener Frist behoben. Meldepflicht: 5 Werktage.' },
    { body: '8.2  Keine Gewährleistung für Drittanbieter-Software; Unterstützung bei Herstellerkommunikation erfolgt nach Möglichkeit.' },
  ])
  y = section(pdf, y, '§ 9  Laufzeit und Kündigung', INDIGO, [
    { body: '9.1  Unbefristeter Vertrag, Inkrafttreten mit beidseitiger Unterzeichnung.' },
    { body: '9.2  Ordentliche Kündigung: 3 Monate zum Monatsende, schriftlich (E-Envelope genügt).' },
    { body: '9.3  Außerordentliche Kündigung aus wichtigem Grund (Pflichtverletzung, Zahlungsverzug >30 Tage, Insolvenz).' },
    { body: '9.4  Bei Vertragsende: vollständige Übergabe aller Zugangsdaten, Dokumentationen und Daten des Auftraggebers.' },
  ])
  y = section(pdf, y, '§ 10  Schlussbestimmungen', INDIGO, [
    { body: '10.1  Deutsches Recht. Gerichtsstand: München (soweit gesetzlich zulässig).' },
    { body: '10.2  Schriftformerfordernis für Änderungen (E-Envelope genügt). Keine mündlichen Nebenabreden.' },
    { body: '10.3  Salvatorische Klausel: Unwirksame Klauseln werden durch wirksame ersetzt, die dem wirtschaftlichen Zweck am nächsten kommen.' },
  ])
  y += 6
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MID)
  pdf.text(`Stockdorf / ___________________________, den ${dateStr}`, 14, y)
  signatureBlock(pdf, y + 4, `${p(v.clientName || '[Auftraggeber]')}  ·  ${p(v.doctorName || '[Name]')}`, `${own.name}  ·  ${own.owner}`)
  docFooter(pdf, 3, 3)
  pdf.save(`IT_Dienstleistungsvertrag_${p(v.clientName || 'Klient').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. Willkommensschreiben
// ══════════════════════════════════════════════════════════════════════════════
function generateWillkommensschreiben(v) {
  const s = loadInvoiceSettings()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const GOLD = [161, 105, 0]
  pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  const dateStr  = v.date      ? new Date(v.date).toLocaleDateString('de-DE')      : new Date().toLocaleDateString('de-DE')
  const startStr = v.startDate ? new Date(v.startDate).toLocaleDateString('de-DE') : '[Vertragsbeginn]'
  let y = docHeader(pdf, GOLD, 'WILLKOMMENS-\nSCHREIBEN', 'Onboarding · Neukunde · Herzlich willkommen', [`Datum: ${dateStr}`])

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...DARK)
  pdf.text(p(v.clientName || '[Praxis]'), 14, y)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MID)
  if (v.clientStreet) pdf.text(p(v.clientStreet), 14, y + 5.5)
  if (v.clientCity)   pdf.text(p(v.clientCity),   14, y + 11)
  pdf.setTextColor(...MUTED)
  pdf.text(`Stockdorf, den ${dateStr}`, W - 14, y, { align: 'right' })
  y += 22

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(...DARK)
  pdf.text(`Sehr geehrte/r ${p(v.doctorName || 'Frau / Herr')},`, 14, y)
  y += 9

  const intro = `herzlich willkommen bei ${p(s.companyName || 'Brani Digitale Losungen')}! Wir freuen uns sehr, Sie und Ihre Praxis als neuen Klienten begrüßen zu dürfen. Mit diesem Schreiben möchten wir Sie offiziell in unserer Gemeinschaft willkommen heißen und Ihnen einen Überblick geben, was Sie in den nächsten Schritten erwartet.`
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MID)
  pdf.splitTextToSize(intro, W - 28).forEach(l => { pdf.text(l, 14, y); y += 5 })
  y += 6

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.setTextColor(...DARK)
  pdf.text('Ihre nächsten Schritte:', 14, y)
  y += 9

  const steps = [
    `Slack-Kanal: Sie erhalten in Kürze eine Einladung zu Ihrem persönlichen Slack-Kanal — Ihr direkter Draht zu uns für alle Fragen, Support und Anfragen.`,
    `IT-Bestandsaufnahme: Beim ersten Termin erfassen wir gemeinsam Ihre bestehende IT-Infrastruktur, um Ihnen optimal helfen zu können.`,
    `IT-Aktionsplan: Auf Basis der Bestandsaufnahme erstellen wir einen individuellen Maßnahmenplan mit klaren Prioritäten.`,
    `Leistungsstart: Die vereinbarten IT-Dienstleistungen starten gemäß Ihrem Vertrag ab dem ${startStr}.`,
  ]
  steps.forEach((step, i) => {
    pdf.setFillColor(...GOLD); pdf.roundedRect(14, y - 5.5, 8, 7, 2, 2, 'F')
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...WHITE)
    pdf.text(`${i + 1}`, 18, y - 0.8, { align: 'center' })
    pdf.setFillColor(GOLD[0], GOLD[1], GOLD[2], 0.12)
    pdf.setDrawColor(...GOLD); pdf.setLineWidth(0.3)
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MID)
    const lines = pdf.splitTextToSize(step, W - 36)
    lines.forEach((l, li) => pdf.text(l, 25, y + li * 5 - 3))
    y += Math.max(8, lines.length * 5) + 5
  })
  y += 4

  pdf.setFillColor(...LIGHT); pdf.roundedRect(14, y, W - 28, 30, 4, 4, 'F')
  pdf.setFillColor(...GOLD); pdf.rect(14, y, 3, 30, 'F')
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(...GOLD)
  pdf.text('Ihre Kontaktdaten zu uns:', 21, y + 8)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MID)
  pdf.text(`E-Envelope: ${s.email || 'contact@branislavciric.com'}`, 21, y + 15)
  pdf.text(`Website: ${s.website || 'www.branislavciric.com'}`, 21, y + 21)
  pdf.text(`Erreichbarkeit: Mo–Fr 09:00–18:00 Uhr   |   Reaktionszeit (kritisch): 4–6 Stunden`, 21, y + 27)
  y += 38

  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MID)
  pdf.text('Wir freuen uns auf eine erfolgreiche und langfristige Zusammenarbeit!', 14, y)
  y += 8; pdf.text('Mit freundlichen Grüßen,', 14, y)
  y += 14
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...DARK)
  pdf.text(p(s.ownerName || 'Branislav Ciric'), 14, y)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...MUTED)
  pdf.text(p(s.companyName || 'Brani Digitale Losungen'), 14, y + 5)
  docFooter(pdf, 1, 1)
  pdf.save(`Willkommensschreiben_${p(v.clientName || 'Klient').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. IT-Bestandsaufnahme
// ══════════════════════════════════════════════════════════════════════════════
function generateITBestandsaufnahme(v) {
  const s = loadInvoiceSettings()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const TEAL = [13, 148, 136]
  pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  const dateStr = v.date ? new Date(v.date).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')
  let y = docHeader(pdf, TEAL, 'IT-BESTANDS-\nAUFNAHME', 'IT-Inventar · Ersterfassung · Gesundheitswesen', [`Datum: ${dateStr}`, p(v.clientName || '')])

  y = section(pdf, y, 'Praxisdaten', TEAL, [
    { body: `Praxis: ${p(v.clientName || '[Praxisname]')}   |   Ansprechpartner: ${p(v.doctorName || '[Name]')}` },
    { body: `Adresse: ${p(v.clientStreet || '[Strasse]')}, ${p(v.clientCity || '[PLZ Stadt]')}   |   Mitarbeiter: ${v.mitarbeiter || '—'}   |   IT-Berater: ${p(s.ownerName || 'Branislav Ciric')}` },
  ])

  y = section(pdf, y, 'Hardware-Inventar (bitte vor Ort ausfüllen)', TEAL, [])
  y = drawTable(pdf, y - 4, ['Geräteart', 'Anz.', 'Hersteller / Modell', 'Alter ca.', 'Zustand', 'Bemerkung'], [
    ['Desktop-PC', '', '', '', '', ''],
    ['Laptop / Notebook', '', '', '', '', ''],
    ['Server / NAS', '', '', '', '', ''],
    ['Drucker', '', '', '', '', ''],
    ['Scanner / MFG', '', '', '', '', ''],
    ['Monitor', '', '', '', '', ''],
    ['Sonstiges', '', '', '', '', ''],
  ], [38, 14, 44, 20, 24, 42], TEAL)

  y = section(pdf, y, 'Netzwerk-Inventar', TEAL, [])
  y = drawTable(pdf, y - 4, ['Komponente', 'Hersteller / Modell', 'Alter ca.', 'WLAN', 'VPN', 'Bemerkung'], [
    ['Router / Firewall', '', '', '', '', ''],
    ['Switch', '', '', '', '', ''],
    ['WLAN Access Point', '', '', '', '', ''],
    ['Modem / ONT', '', '', '', '', ''],
    ['Sonstiges', '', '', '', '', ''],
  ], [40, 44, 20, 14, 14, 50], TEAL)

  docFooter(pdf, 1, 2)

  pdf.addPage(); pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  y = docPage2Header(pdf, TEAL)

  y = section(pdf, y, 'Software & Systeme', TEAL, [
    { body: `Betriebssystem: ${p(v.betriebssystem || '_________________________________')}` },
    { body: `Antivirensoftware: ${p(v.antivirus || '_________________________________')}` },
    { body: `Praxissoftware: ${p(v.praxisSoftware || '_________________________________')}` },
    { body: `Microsoft 365 / Office: ${p(v.office365 || '_________________________________')}` },
    { body: `E-Envelope-System: ${p(v.emailSystem || '_________________________________')}` },
    { body: `Backup-Lösung: ${p(v.backupSystem || '_________________________________')}` },
    { body: `Cloud-Dienste: ${p(v.cloudDienste || '_________________________________')}` },
  ])

  y = section(pdf, y, 'IT-Sicherheit — Erstcheck', TEAL, [
    { check: false, label: 'Firewall aktiv und konfiguriert' },
    { check: false, label: 'Antivirus auf allen Geräten installiert und aktuell' },
    { check: false, label: 'Automatische Windows/System-Updates aktiviert' },
    { check: false, label: 'WLAN-Passwort stark (mind. 12 Zeichen, WPA3 oder WPA2)' },
    { check: false, label: 'Gast-WLAN vom internen Netzwerk getrennt' },
    { check: false, label: 'Passwortrichtlinie vorhanden (mind. 10 Zeichen)' },
    { check: false, label: 'Regelmäßige Datensicherung (Backup) vorhanden und getestet' },
    { check: false, label: 'Multi-Faktor-Authentifizierung (MFA) aktiviert' },
    { check: false, label: 'Alle Mitarbeiter im Datenschutz geschult' },
  ])

  y = section(pdf, y, 'Bekannte Probleme / Sofortmaßnahmen', TEAL, [
    { body: `${p(v.probleme || '___________________________________________________________________________________\n___________________________________________________________________________________\n___________________________________________________________________________________')}` },
  ])

  y += 6
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MID)
  pdf.text(`Aufnahmedatum: ${dateStr}`, 14, y)
  signatureBlock(pdf, y + 4, `Praxisinhaber: ${p(v.doctorName || '[Name]')}`, `IT-Berater: ${p(s.ownerName || 'Branislav Ciric')}`)
  docFooter(pdf, 2, 2)
  pdf.save(`IT_Bestandsaufnahme_${p(v.clientName || 'Praxis').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. Abnahmeprotokoll
// ══════════════════════════════════════════════════════════════════════════════
function generateAbnahmeprotokoll(v) {
  const s = loadInvoiceSettings()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const CYAN = [6, 148, 162]
  pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  const dateStr = v.date ? new Date(v.date).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')
  let y = docHeader(pdf, CYAN, 'ABNAHME-\nPROTOKOLL', 'Projektabschluss · Leistungsabnahme · Unterschrift', [`Datum: ${dateStr}`, p(v.clientName || '')])

  y = section(pdf, y, 'Projektdaten', CYAN, [
    { body: `Auftraggeber: ${p(v.clientName || '[Praxis]')}   |   Vertreten durch: ${p(v.doctorName || '[Name]')}` },
    { body: `Projekt: ${p(v.projektName || '[Projektbezeichnung]')}` },
    { body: `Beschreibung: ${p(v.projektBeschreibung || '[Kurzbeschreibung der erbrachten Leistungen]')}` },
    { body: `Auftragnehmer: ${p(s.companyName || 'Brani Digitale Losungen')}, ${p(s.ownerName || 'Branislav Ciric')}` },
  ])

  const leistungItems = v.leistungen
    ? v.leistungen.split(',').map(l => l.trim()).filter(Boolean).map(l => ({ body: `•  ${l}` }))
    : [{ body: '[Keine Leistungen angegeben]' }]

  y = section(pdf, y, 'Erbrachte Leistungen', CYAN, [
    { body: 'Folgende Leistungen wurden im Rahmen dieses Projektes vollständig erbracht:' },
    ...leistungItems,
  ])

  y = section(pdf, y, 'Abnahmeprüfung', CYAN, [
    { body: 'Der Auftraggeber bestätigt die Prüfung der erbrachten Leistungen anhand folgender Kriterien:' },
    { check: false, label: 'Alle vereinbarten Leistungen wurden erbracht und übergeben' },
    { check: false, label: 'Die Systeme / Ergebnisse funktionieren wie vereinbart' },
    { check: false, label: 'Zugangsdaten, Dokumentation und Anleitungen wurden übergeben' },
    { check: false, label: 'Schulung / Einweisung der Mitarbeiter erfolgt (falls vereinbart)' },
    { check: false, label: 'Keine wesentlichen Mängel festgestellt' },
    { check: false, label: 'Offene Punkte (falls vorhanden) sind schriftlich vereinbart' },
  ])

  y = section(pdf, y, 'Offene Punkte / Anmerkungen', CYAN, [
    { body: p(v.anmerkungen || '___________________________________________________________________________________\n___________________________________________________________________________________') },
  ])

  y = section(pdf, y, 'Abnahmeerklärung', CYAN, [
    { body: 'Der Auftraggeber bestätigt mit seiner Unterschrift die vollständige und mangelfreie Abnahme der oben genannten Leistungen. Die Gewährleistungsfrist beginnt mit dem Datum dieses Protokolls.' },
  ])

  y += 4
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MID)
  pdf.text(`Ort / Datum: ___________________________, den ${dateStr}`, 14, y)
  signatureBlock(pdf, y + 4, `Auftraggeber: ${p(v.doctorName || '[Name, Praxis]')}`, `Auftragnehmer: ${p(s.ownerName || 'Branislav Ciric')}`)
  docFooter(pdf, 1, 1)
  pdf.save(`Abnahmeprotokoll_${p(v.projektName || v.clientName || 'Projekt').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. Wartungsprotokoll
// ══════════════════════════════════════════════════════════════════════════════
function generateWartungsprotokoll(v) {
  const s = loadInvoiceSettings()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const VIOLET = [109, 40, 217]
  pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  const dateStr = v.date ? new Date(v.date).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')
  const nextStr = v.naechsterTermin ? new Date(v.naechsterTermin).toLocaleDateString('de-DE') : '—'
  let y = docHeader(pdf, VIOLET, 'WARTUNGS-\nPROTOKOLL', 'IT-Service · Vor Ort / Remote · Dokumentation', [`Datum: ${dateStr}`, p(v.clientName || '')])

  y = section(pdf, y, 'Einsatzdaten', VIOLET, [
    { body: `Kunde: ${p(v.clientName || '[Praxis]')}   |   Ansprechpartner: ${p(v.doctorName || '[Name]')}` },
    { body: `Techniker: ${p(v.techniker || p(s.ownerName || 'Branislav Ciric'))}   |   Datum: ${dateStr}   |   Dauer: ${p(v.dauer || '—')}` },
    { body: `Art des Einsatzes: ${p(v.artDesEinsatzes || 'Vor Ort')}` },
  ])

  y = section(pdf, y, 'Durchgeführte Arbeiten', VIOLET, [
    { body: p(v.arbeiten || '_________________________________________\n_________________________________________\n_________________________________________\n_________________________________________') },
  ])

  y = section(pdf, y, 'Festgestellte Probleme', VIOLET, [
    { body: p(v.probleme || '___________________________________________________________________________________\n___________________________________________________________________________________') },
  ])

  y = section(pdf, y, 'Verwendete Teile / Lizenzen', VIOLET, [
    { body: p(v.teile || 'Keine Teile oder Lizenzen verwendet.') },
  ])

  y = section(pdf, y, 'Systemzustand nach Wartung', VIOLET, [
    { check: false, label: 'Alle Systeme funktionsfähig und geprüft' },
    { check: false, label: 'Antivirensoftware aktuell' },
    { check: false, label: 'Windows-Updates installiert' },
    { check: false, label: 'Backup funktionsfähig und getestet' },
    { check: false, label: 'Keine kritischen Ereignisse im Systemlog' },
  ])

  y = section(pdf, y, 'Empfehlungen & Nächster Termin', VIOLET, [
    { body: `Empfehlungen: ${p(v.empfehlungen || 'Keine besonderen Empfehlungen.')}` },
    { body: `Nächster geplanter Wartungstermin: ${nextStr}` },
  ])

  y += 4
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MID)
  pdf.text(`Ort / Datum: ___________________________, den ${dateStr}`, 14, y)
  signatureBlock(pdf, y + 4, `Auftraggeber: ${p(v.doctorName || '[Unterschrift]')}`, `Techniker: ${p(v.techniker || p(s.ownerName || 'Branislav Ciric'))}`)
  docFooter(pdf, 1, 1)
  pdf.save(`Wartungsprotokoll_${p(v.clientName || 'Praxis').replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr.replace(/\./g, '-')}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. NDA — Geheimhaltungsvereinbarung
// ══════════════════════════════════════════════════════════════════════════════
function generateNDA(v) {
  const s = loadInvoiceSettings()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const ROSE = [190, 18, 60]
  pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  const dateStr = v.date ? new Date(v.date).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')
  let y = docHeader(pdf, ROSE, 'GEHEIMHAL-\nTUNGSVERTRAG', 'NDA · Vertraulichkeit · Beiderseitig', [`Datum: ${dateStr}`, p(v.clientName || '')])

  y = section(pdf, y, 'Vertragsparteien', ROSE, [
    { heading: 'Partei A (Auftraggeber):' },
    { body: `${p(v.clientName || '[Praxis]')}, ${p(v.clientStreet || '[Strasse]')}, ${p(v.clientCity || '[PLZ Stadt]')}` },
    { body: `Vertreten durch: ${p(v.doctorName || '[Name]')}` },
    { heading: 'Partei B (Auftragnehmer):' },
    { body: `${p(s.companyName || 'Brani Digitale Losungen')}, Inhaber: ${p(s.ownerName || 'Branislav Ciric')}, Bahnstrasse 3, 82131 Stockdorf` },
  ])
  y = section(pdf, y, '§ 1  Gegenstand der Vereinbarung', ROSE, [
    { body: 'Die Parteien beabsichtigen eine Zusammenarbeit im Bereich IT-Dienstleistungen und Digitalisierung. Im Rahmen dieser Zusammenarbeit werden vertrauliche Informationen ausgetauscht. Der Schutz dieser Informationen ist Gegenstand dieser Vereinbarung.' },
  ])
  y = section(pdf, y, '§ 2  Vertrauliche Informationen', ROSE, [
    { body: 'Als vertraulich gelten alle Informationen, die eine Partei der anderen schriftlich, mündlich, elektronisch oder auf andere Weise zugänglich macht, insbesondere: Patientendaten und medizinische Informationen, Geschäftszahlen und Strategien, technische Systeme und Zugangsdaten, Software, Code und Dokumentationen, Kundendaten, Preisstrukturen und interne Prozesse.' },
  ])
  y = section(pdf, y, '§ 3  Nicht-vertrauliche Informationen', ROSE, [
    { body: 'Von der Geheimhaltungspflicht ausgenommen sind Informationen, die (a) zum Zeitpunkt der Weitergabe öffentlich bekannt sind, (b) der empfangenden Partei vor dem Austausch bereits bekannt waren, (c) von dritter Seite ohne Verletzung einer Geheimhaltungspflicht erhalten wurden, oder (d) auf behördliche oder gerichtliche Anordnung offenbart werden müssen.' },
  ])
  docFooter(pdf, 1, 2)

  pdf.addPage(); pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  y = docPage2Header(pdf, ROSE)
  y = section(pdf, y, '§ 4  Verwendungsverbot', ROSE, [
    { body: 'Jede Partei verpflichtet sich, vertrauliche Informationen der anderen Partei ausschließlich für Zwecke der vereinbarten Zusammenarbeit zu verwenden. Eine Weitergabe an Dritte ist ohne ausdrückliche schriftliche Zustimmung der offenbarenden Partei untersagt. Mitarbeiter und Subunternehmer dürfen nur insoweit Zugang erhalten, als dies für die Durchführung der Zusammenarbeit zwingend erforderlich ist.' },
  ])
  y = section(pdf, y, '§ 5  Laufzeit der Geheimhaltungspflicht', ROSE, [
    { body: 'Diese Vereinbarung tritt mit Unterzeichnung in Kraft. Die Geheimhaltungspflicht besteht während der gesamten Dauer der Zusammenarbeit sowie für einen Zeitraum von 3 (drei) Jahren nach deren Beendigung, unabhängig vom Grund der Beendigung.' },
  ])
  y = section(pdf, y, '§ 6  Vertragsstrafe', ROSE, [
    { body: 'Bei jeder schuldhaften Verletzung der Geheimhaltungspflicht ist die verletzende Partei zur Zahlung einer Vertragsstrafe in Höhe von 10.000,00 € (zehntausend Euro) je Einzelverstoß verpflichtet. Die Geltendmachung weitergehender Schadensersatzansprüche bleibt vorbehalten.' },
  ])
  y = section(pdf, y, '§ 7  Schlussbestimmungen', ROSE, [
    { body: '7.1  Deutsches Recht. Gerichtsstand: München.' },
    { body: '7.2  Änderungen und Ergänzungen bedürfen der Schriftform (E-Envelope genügt).' },
    { body: '7.3  Salvatorische Klausel: Unwirksame Klauseln werden durch wirksame ersetzt.' },
    { body: '7.4  Diese Vereinbarung wurde in zwei gleichlautenden Ausfertigungen erstellt.' },
  ])
  y += 8
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MID)
  pdf.text(`Ort / Datum: ___________________________, den ${dateStr}`, 14, y)
  signatureBlock(pdf, y + 4, `Partei A: ${p(v.clientName || '[Auftraggeber]')}  ·  ${p(v.doctorName || '')}`, `Partei B: ${p(s.companyName || 'Brani Digitale Losungen')}  ·  ${p(s.ownerName || 'Branislav Ciric')}`)
  docFooter(pdf, 2, 2)
  pdf.save(`NDA_Geheimhaltung_${p(v.clientName || 'Klient').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. SLA — Service Level Agreement
// ══════════════════════════════════════════════════════════════════════════════
function generateSLA(v) {
  const s = loadInvoiceSettings()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const SKY = [2, 132, 199]
  pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  const dateStr = v.date ? new Date(v.date).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')
  let y = docHeader(pdf, SKY, 'SERVICE LEVEL\nAGREEMENT', 'SLA · Reaktionszeiten · Verfügbarkeit · Support', [`Datum: ${dateStr}`, p(v.clientName || '')])

  y = section(pdf, y, 'Vertragsparteien', SKY, [
    { body: `Auftraggeber: ${p(v.clientName || '[Praxis]')}   |   Ansprechpartner: ${p(v.doctorName || '[Name]')}` },
    { body: `Auftragnehmer: ${p(s.companyName || 'Brani Digitale Losungen')}, ${p(s.ownerName || 'Branislav Ciric')}` },
    { body: `Vereinbartes SLA-Niveau: ${p(v.slaLevel || 'Standard')}   |   Gültig ab: ${dateStr}` },
  ])

  y = section(pdf, y, 'Servicezeiten & Erreichbarkeit', SKY, [
    { body: 'Reguläre Servicezeiten: Montag bis Freitag, 09:00–18:00 Uhr (außer gesetzliche Feiertage Bayern).' },
    { body: 'Außerhalb der Servicezeiten: Erreichbarkeit per E-Envelope und Slack. Bearbeitung am nächsten Werktag.' },
    { body: 'Kommunikationskanal: Slack (dedizierter Kanal pro Kunde), E-Envelope, Telefon.' },
  ])

  y = section(pdf, y, 'Prioritäten & Reaktionszeiten', SKY, [])
  y = drawTable(pdf, y - 4,
    ['Priorität', 'Beispiel / Beschreibung', 'Erstreaktion*', 'Lösungszeit*'],
    [
      ['Kritisch (P1)', 'Totalausfall — keine Systeme verfügbar', '2 Stunden', '8 Arbeitsstunden'],
      ['Hoch (P2)', 'Wesentliches System ausgefallen', '4 Stunden', 'Nächster Werktag'],
      ['Mittel (P3)', 'Eingeschränkte Funktionalität', '6 Stunden', '3 Werktage'],
      ['Niedrig (P4)', 'Kosmetisch, Anfragen, Verbesserungen', '1 Werktag', 'Nach Vereinbarung'],
    ],
    [38, 70, 32, 42], SKY)

  pdf.setFont('helvetica', 'italic'); pdf.setFontSize(7.5); pdf.setTextColor(...MUTED)
  pdf.text('* Reaktions- und Lösungszeiten gelten während regulärer Servicezeiten (Mo–Fr 09–18 Uhr).', 14, y)
  y += 8

  y = section(pdf, y, 'Verfügbarkeit & Wartungsfenster', SKY, [
    { body: 'Verfügbarkeitsziel: 99 % der vereinbarten Servicezeiten (Mo–Fr 09–18 Uhr).' },
    { body: 'Geplante Wartungsfenster: Sonntags 22:00–02:00 Uhr. Ankündigung mindestens 48 Stunden vorab.' },
    { body: 'Ausgenommen von der Verfügbarkeitsgarantie: Höhere Gewalt, Ausfall von Dritten (Internet, Strom, Cloud-Anbieter), Mängel an Hardware des Auftraggebers.' },
  ])

  docFooter(pdf, 1, 2)

  pdf.addPage(); pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  y = docPage2Header(pdf, SKY)

  y = section(pdf, y, 'Eskalationsprozess', SKY, [
    { body: '1. Stufe: Direkter Kontakt über Slack-Kanal oder E-Envelope — Erstreaktion gemäß Priorität.' },
    { body: '2. Stufe: Bei nicht fristgerechter Reaktion: Direkte Telefonkontaktaufnahme durch Auftraggeber.' },
    { body: '3. Stufe: Schriftliche Eskalationsmeldung per E-Envelope mit Schilderung des Problems und bisherigen Reaktionszeiten.' },
    { body: 'Kontakt: ' + (s.email || 'contact@branislavciric.com') + '   |   ' + (s.website || 'www.branislavciric.com') },
  ])

  y = section(pdf, y, 'Reporting & Dokumentation', SKY, [
    { body: 'Auf Wunsch erstellt der Auftragnehmer monatliche Service-Reports mit Übersicht über bearbeitete Tickets, Reaktionszeiten und geplante Maßnahmen.' },
    { body: 'Jeder Wartungs- oder Supporteinsatz wird durch ein Wartungsprotokoll dokumentiert und dem Auftraggeber übergeben.' },
  ])

  y = section(pdf, y, 'Ausschlüsse', SKY, [
    { body: '•  Fehler in Software Dritter (Microsoft, Praxissoftware-Hersteller, Cloud-Anbieter).' },
    { body: '•  Schäden durch unsachgemäße Nutzung durch Mitarbeiter des Auftraggebers.' },
    { body: '•  Probleme durch nicht autorisierte Änderungen an IT-Systemen ohne Absprache.' },
    { body: '•  Verzögerungen durch fehlende Mitwirkung des Auftraggebers (Zugangsdaten, Verfügbarkeit).' },
  ])

  y = section(pdf, y, 'Anpassung des SLA', SKY, [
    { body: 'Dieses SLA kann von beiden Parteien mit einer Frist von 4 Wochen schriftlich angepasst werden. Es ist Bestandteil des IT-Dienstleistungsvertrages und gilt solange dieser Vertrag in Kraft ist.' },
  ])

  y += 8
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MID)
  pdf.text(`Ort / Datum: ___________________________, den ${dateStr}`, 14, y)
  signatureBlock(pdf, y + 4, `Auftraggeber: ${p(v.clientName || '[Praxis]')}  ·  ${p(v.doctorName || '')}`, `Auftragnehmer: ${p(s.companyName || 'Brani Digitale Losungen')}  ·  ${p(s.ownerName || 'Branislav Ciric')}`)
  docFooter(pdf, 2, 2)
  pdf.save(`SLA_Service_Level_Agreement_${p(v.clientName || 'Klient').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. SEPA-Lastschriftmandat
// ══════════════════════════════════════════════════════════════════════════════
function generateSEPA(v) {
  const s = loadInvoiceSettings()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const SLATE = [71, 85, 105]
  pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  const dateStr = v.date ? new Date(v.date).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')
  const mandRef = v.mandatsRef || `BDL-${p(v.clientName || 'XX').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)}-${Date.now().toString().slice(-4)}`
  let y = docHeader(pdf, SLATE, 'SEPA-LAST-\nSCHRIFTMANDAT', 'SEPA Basislastschrift · Einzugsermächtigung', [`Datum: ${dateStr}`, p(v.clientName || '')])

  y = section(pdf, y, 'Gläubigerdaten', SLATE, [
    { body: `Gläubiger: ${p(s.companyName || 'Brani Digitale Losungen')}, Inhaber: ${p(s.ownerName || 'Branislav Ciric')}` },
    { body: `Adresse: Bahnstrasse 3, 82131 Stockdorf` },
    { body: `Gläubiger-Identifikationsnummer: ${s.creditorId || '[DE-Gläubiger-ID – wird nachgereicht]'}` },
    { body: `Mandatsreferenz: ${mandRef}` },
  ])

  y = section(pdf, y, 'Schuldnerdaten (Auftraggeber)', SLATE, [
    { body: `Name / Praxis: ${p(v.clientName || '[Praxisname]')}` },
    { body: `Kontoinhaber: ${p(v.kontoinhaberName || '[Name des Kontoinhabers]')}` },
    { body: `IBAN: ${p(v.iban || '[IBAN]')}` },
    { body: `BIC: ${p(v.bic || '[BIC]')}` },
    { body: `Kreditinstitut: ${p(v.bank || '[Name der Bank]')}` },
  ])

  // Highlighted authorization box
  y += 4
  pdf.setFillColor(241, 245, 249); pdf.roundedRect(14, y, W - 28, 42, 4, 4, 'F')
  pdf.setDrawColor(...SLATE); pdf.setLineWidth(0.6); pdf.roundedRect(14, y, W - 28, 42, 4, 4, 'S')
  pdf.setFillColor(...SLATE); pdf.rect(14, y, 4, 42, 'F')
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(...SLATE)
  pdf.text('SEPA-Einzugsermächtigung (Basislastschrift)', 22, y + 8)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...MID)
  const sepaText = `Ich ermächtige / Wir ermächtigen ${p(s.companyName || 'Brani Digitale Losungen')}, Zahlungen von meinem/unserem Konto mittels Lastschrift einzuziehen. Zugleich weise ich mein/weisen wir unser Kreditinstitut an, die von ${p(s.companyName || 'Brani Digitale Losungen')} auf mein/unser Konto gezogenen Lastschriften einzulösen.`
  const sepaLines = pdf.splitTextToSize(sepaText, W - 40)
  sepaLines.forEach((l, i) => pdf.text(l, 22, y + 16 + i * 4.8))
  y += sepaLines.length * 4.8 + 22
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(190, 18, 60)
  pdf.text('Hinweis: Ich kann/Wir können innerhalb von 8 Wochen, beginnend mit dem Belastungsdatum, die Erstattung des belasteten Betrages verlangen. Es gelten die mit meinem/unserem Kreditinstitut vereinbarten Bedingungen.', 22, y)
  const hinweisLines = pdf.splitTextToSize('Hinweis: Ich kann/Wir können innerhalb von 8 Wochen, beginnend mit dem Belastungsdatum, die Erstattung des belasteten Betrages verlangen. Es gelten die mit meinem/unserem Kreditinstitut vereinbarten Bedingungen.', W - 40)
  y += hinweisLines.length * 4.2 + 12

  y = section(pdf, y, 'Verwendungszweck & Zahlungsintervall', SLATE, [
    { body: `Verwendungszweck: IT-Dienstleistungen gemäß Dienstleistungsvertrag — ${p(v.clientName || '[Praxis]')}` },
    { body: `Zahlungsintervall: Monatlich (Abbuchung jeweils zum Monatsletzten)` },
    { body: `Erstabbuchung voraussichtlich: ${p(v.erstabbuchung || '[Datum der ersten Abbuchung]')}` },
  ])

  y += 4
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MID)
  pdf.text(`Ort / Datum: ${p(v.signatureCity || '[Ort]')}, den ${dateStr}`, 14, y)
  signatureBlock(pdf, y + 4, `Kontoinhaber: ${p(v.kontoinhaberName || '[Name]')}  ·  ${p(v.clientName || '')}`)
  docFooter(pdf, 1, 1)
  pdf.save(`SEPA_Mandat_${p(v.clientName || 'Klient').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 9. Schulungsprotokoll
// ══════════════════════════════════════════════════════════════════════════════
function generateSchulungsprotokoll(v) {
  const s = loadInvoiceSettings()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const AMBER = [180, 83, 9]
  pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  const dateStr = v.date ? new Date(v.date).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')
  let y = docHeader(pdf, AMBER, 'SCHULUNGS-\nPROTOKOLL', 'IT-Schulung · Mitarbeiterschulung · Dokumentation', [`Datum: ${dateStr}`, p(v.clientName || '')])

  y = section(pdf, y, 'Schulungsdaten', AMBER, [
    { body: `Auftraggeber: ${p(v.clientName || '[Praxis]')}   |   Ansprechpartner: ${p(v.doctorName || '[Name]')}` },
    { body: `Schulungsthema: ${p(v.schulungsthema || '[Thema]')}` },
    { body: `Ort: ${p(v.ort || '[Ort der Schulung]')}   |   Datum: ${dateStr}   |   Dauer: ${p(v.dauer || '—')}` },
    { body: `Trainer / Referent: ${p(v.trainer || p(s.ownerName || 'Branislav Ciric'))}` },
  ])

  y = section(pdf, y, 'Schulungsinhalt', AMBER, [
    { body: p(v.inhalt || '___________________________________________________________________________________\n___________________________________________________________________________________\n___________________________________________________________________________________\n___________________________________________________________________________________') },
  ])

  // Teilnehmerliste
  const teilnehmerNames = v.teilnehmer
    ? v.teilnehmer.split(',').map(t => t.trim()).filter(Boolean)
    : []
  const emptyRows = Math.max(6, teilnehmerNames.length + 2)
  const rows = Array.from({ length: emptyRows }, (_, i) => [
    `${i + 1}.`,
    teilnehmerNames[i] ? p(teilnehmerNames[i]) : '',
    '',
    '',
  ])

  y = section(pdf, y, 'Teilnehmerliste', AMBER, [])
  y = drawTable(pdf, y - 4, ['Nr.', 'Name / Vorname', 'Funktion / Rolle', 'Unterschrift'], rows, [14, 68, 52, 48], AMBER)

  y = section(pdf, y, 'Lernzielkontrolle', AMBER, [
    { check: false, label: 'Schulungsziele wurden vollständig vermittelt' },
    { check: false, label: 'Teilnehmer konnten Fragen stellen, alle wurden beantwortet' },
    { check: false, label: 'Praktische Übungen / Demonstrationen durchgeführt' },
    { check: false, label: 'Schulungsunterlagen / Handout ausgeteilt' },
    { check: false, label: 'Folgeschulung vereinbart / empfohlen' },
  ])

  y = section(pdf, y, 'Anmerkungen & Feedback', AMBER, [
    { body: p(v.anmerkungen || '___________________________________________________________________________________\n___________________________________________________________________________________') },
  ])

  y += 4
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MID)
  pdf.text(`Ort / Datum: ___________________________, den ${dateStr}`, 14, y)
  signatureBlock(pdf, y + 4, `Auftraggeber: ${p(v.doctorName || '[Name, Praxis]')}`, `Trainer: ${p(v.trainer || p(s.ownerName || 'Branislav Ciric'))}`)
  docFooter(pdf, 1, 1)
  pdf.save(`Schulungsprotokoll_${p(v.clientName || 'Praxis').replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr.replace(/\./g, '-')}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 10. Angebot / Kostenvoranschlag
// ══════════════════════════════════════════════════════════════════════════════
function generateAngebot(v) {
  const s = loadInvoiceSettings()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const CYAN = [14, 116, 144]

  pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')

  const dateStr = v.date ? new Date(v.date).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')
  const validDays = parseInt(v.validDays) || 30
  const baseDate = v.date ? new Date(v.date) : new Date()
  const validDate = new Date(baseDate.getTime() + validDays * 24 * 60 * 60 * 1000)
  const validStr = validDate.toLocaleDateString('de-DE')
  const angebotNr = v.angebotNr || `ANG-${new Date().getFullYear()}-${String(s.nextOfferNr || 1).padStart(3, '0')}`
  const vatRate = parseFloat(v.vatRate) || 19
  const items = (Array.isArray(v.items) ? v.items : []).filter(it => it.beschreibung?.trim())

  let y = docHeader(pdf, CYAN, 'ANGEBOT', 'Kostenvoranschlag · IT-Dienstleistungen · Gesundheitswesen',
    [`Nr.: ${angebotNr}`, `Datum: ${dateStr}`, `Gültig bis: ${validStr}`])

  // Sender reference line
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...MUTED)
  pdf.text(p(s.companyName || 'Brani Digitale Losungen') + ' · Bahnstrasse 3 · 82131 Stockdorf · ' + (s.email || 'contact@branislavciric.com'), 14, y)
  y += 8
  pdf.setDrawColor(220, 228, 240); pdf.setLineWidth(0.3); pdf.line(14, y - 2, W - 14, y - 2)

  // Recipient block
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(...DARK)
  pdf.text(p(v.clientName || '[Empfänger]'), 14, y + 4)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MID)
  if (v.clientStreet) { pdf.text(p(v.clientStreet), 14, y + 11) }
  if (v.clientCity)   { pdf.text(p(v.clientCity),   14, y + 17) }
  if (v.clientEmail)  { pdf.text(v.clientEmail,      14, y + 23) }

  // Meta box (right side)
  const bx = W - 14 - 70
  pdf.setFillColor(...LIGHT); pdf.roundedRect(bx, y, 70, 30, 3, 3, 'F')
  pdf.setDrawColor(...CYAN); pdf.setLineWidth(0.4); pdf.roundedRect(bx, y, 70, 30, 3, 3, 'S')
  const metaRows = [['Angebots-Nr.:', angebotNr], ['Datum:', dateStr], ['Gültig bis:', validStr]]
  pdf.setFontSize(8)
  metaRows.forEach(([label, val], i) => {
    pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...MID); pdf.text(label, bx + 4, y + 9 + i * 8)
    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...DARK); pdf.text(val, bx + 66, y + 9 + i * 8, { align: 'right' })
  })
  y += 38

  // Items table
  const cw = [10, 84, 16, 22, 25, 25]
  const hdrs = ['Pos.', 'Leistung / Beschreibung', 'Menge', 'Einheit', 'Einzelpreis', 'Gesamt']
  const rows = items.length > 0
    ? items.map((it, i) => {
        const total = (parseFloat(it.menge) || 1) * (parseFloat(it.preis) || 0)
        return [`${i + 1}`, p(it.beschreibung), String(it.menge || '1'), it.einheit || 'Pauschal',
          `${parseFloat(it.preis || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`,
          `${total.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`]
      })
    : [['—', 'Keine Positionen erfasst', '', '', '', '']]

  y = drawTable(pdf, y, hdrs, rows, cw, CYAN)

  // Totals
  const netto  = items.reduce((sum, it) => sum + (parseFloat(it.menge) || 1) * (parseFloat(it.preis) || 0), 0)
  const vat    = netto * vatRate / 100
  const brutto = netto + vat
  const fmt    = n => n.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €'
  const totW = 88, totX = W - 14 - totW

  const drawTotalRow = (label, value, highlight) => {
    if (highlight) {
      pdf.setFillColor(...CYAN); pdf.roundedRect(totX, y, totW, 11, 2, 2, 'F')
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(...WHITE)
      pdf.text(label, totX + 4, y + 7.5)
      pdf.text(value, W - 14, y + 7.5, { align: 'right' })
      y += 13
    } else {
      pdf.setFillColor(...LIGHT); pdf.rect(totX, y, totW, 8, 'F')
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MID)
      pdf.text(label, totX + 4, y + 5.5)
      pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...DARK)
      pdf.text(value, W - 14, y + 5.5, { align: 'right' })
      y += 8
    }
  }

  y += 2
  drawTotalRow(`Nettobetrag:`, fmt(netto), false)
  drawTotalRow(`MwSt. ${vatRate} %:`, fmt(vat), false)
  drawTotalRow('GESAMTBETRAG INKL. MWST.', fmt(brutto), true)
  y += 6

  // Notes
  if (v.notes) {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MID)
    pdf.splitTextToSize(p(v.notes), W - 28).forEach(l => { pdf.text(l, 14, y); y += 5 })
    y += 3
  }

  // Next steps
  y = section(pdf, y, 'Auftragserteilung & nächste Schritte', CYAN, [
    { body: `Wir freuen uns auf die Zusammenarbeit! Bitte bestätigen Sie dieses Angebot bis zum ${validStr} per E-Envelope oder Unterschrift.` },
    { body: 'Nach Ihrer Bestätigung senden wir Ihnen den IT-Dienstleistungsvertrag und alle weiteren Unterlagen zu — die Zusammenarbeit kann dann sofort beginnen.' },
    { body: `Kontakt: ${s.email || 'contact@branislavciric.com'}   |   ${s.website || 'www.branislavciric.com'}` },
  ])

  y += 4
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MID)
  pdf.text(`Stockdorf, den ${dateStr}`, 14, y)
  signatureBlock(pdf, y + 4,
    `Auftraggeber: ${p(v.clientName || '[Praxis]')}  —  Datum: ____________`,
    `Auftragnehmer: ${p(s.ownerName || 'Branislav Ciric')}`)

  docFooter(pdf, 1, 1)
  pdf.save(`Angebot_${angebotNr}_${p(v.clientName || 'Klient').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 11. DSGVO-Datenschutzerklärung
// ══════════════════════════════════════════════════════════════════════════════
function generateDSGVO(v) {
  const s = loadInvoiceSettings()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const BLUE = [37, 99, 235]
  pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  const dateStr = v.date ? new Date(v.date).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')
  let y = docHeader(pdf, BLUE, 'DATENSCHUTZ-\nERKLARUNG', 'Art. 13 / 14 DSGVO · GDPR-konform', [`Stand: ${dateStr}`, v.praxisName || ''])

  y = section(pdf, y, '1. Verantwortlicher', BLUE, [
    { body: 'Verantwortlicher im Sinne der DSGVO:' },
    { heading: v.praxisName || '[Praxisname]' },
    { body: `${v.praxisStreet || '[Strasse]'}, ${v.praxisZip || '[PLZ]'} ${v.praxisCity || '[Stadt]'}` },
    { body: `Vertreten durch: ${p(v.doctorName || '[Name]')}` },
    { body: `E-Envelope: ${v.email || '[E-Envelope]'}   |   Telefon: ${v.phone || '[Telefon]'}` },
    { body: v.website ? `Website: ${v.website}` : '' },
  ])
  y = section(pdf, y, '2. Zwecke der Datenverarbeitung', BLUE, [
    { body: '•  Durchführung der medizinischen Behandlung (Art. 9 Abs. 2 lit. h DSGVO)' },
    { body: '•  Abrechnung mit Krankenversicherungen (Art. 6 Abs. 1 lit. b DSGVO)' },
    { body: '•  Gesetzliche Aufbewahrungs- und Dokumentationspflichten (Art. 6 Abs. 1 lit. c DSGVO)' },
    { body: '•  Terminverwaltung und Patientenkommunikation (Art. 6 Abs. 1 lit. f DSGVO)' },
  ])
  y = section(pdf, y, '3. Kategorien personenbezogener Daten', BLUE, [
    { body: '•  Stammdaten: Name, Adresse, Geburtsdatum, Versicherungsnummer' },
    { body: '•  Gesundheitsdaten: Diagnosen, Befunde, Behandlungsverläufe, Medikationen' },
    { body: '•  Kommunikationsdaten: Telefon, E-Envelope' },
    { body: '•  Abrechnungsdaten: Leistungsdaten, Krankenkasseninformationen' },
  ])
  docFooter(pdf, 1, 2)

  pdf.addPage(); pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  y = docPage2Header(pdf, BLUE)
  y = section(pdf, y, '4. Speicherdauer', BLUE, [
    { body: '•  Patientenakten: 10 Jahre nach Abschluss der Behandlung (§ 10 MBO-Ä)' },
    { body: '•  Röntgenaufnahmen: 10 Jahre nach Erstellung (§ 28 RöV)' },
    { body: '•  Abrechnungsunterlagen: 6–10 Jahre (steuerrechtlich)' },
  ])
  y = section(pdf, y, '5. Rechte der betroffenen Personen', BLUE, [
    { body: '•  Auskunftsrecht (Art. 15 DSGVO): Auskunft über gespeicherte Daten' },
    { body: '•  Berichtigungsrecht (Art. 16 DSGVO): Korrektur unrichtiger Daten' },
    { body: '•  Löschungsrecht (Art. 17 DSGVO): Löschung, soweit keine Aufbewahrungspflicht besteht' },
    { body: '•  Einschränkung der Verarbeitung (Art. 18 DSGVO)' },
    { body: '•  Widerspruchsrecht (Art. 21 DSGVO)' },
    { body: '•  Beschwerderecht: Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Ansbach' },
  ])
  y = section(pdf, y, '6. Datensicherheit', BLUE, [
    { body: 'Technische und organisatorische Maßnahmen gemäß Art. 32 DSGVO: verschlüsselte Datenspeicherung, Zugangskontrollsysteme, regelmäßige Datensicherungen, Mitarbeiterschulungen.' },
    { body: `IT-Infrastruktur betreut durch: ${p(s.companyName || 'Brani Digitale Losungen')} (${p(s.ownerName || 'Branislav Ciric')}, ${s.email || 'contact@branislavciric.com'}).` },
  ])
  y = section(pdf, y, '7. Kontakt & Beschwerderecht', BLUE, [
    { body: 'Bei Datenschutzfragen wenden Sie sich an den Verantwortlichen (s. Abschnitt 1). Beschwerden: BayLDA, Promenade 27, 91522 Ansbach.' },
  ])
  y += 6
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MID)
  pdf.text(`${p(v.praxisCity || '')}, den ${dateStr}`, 14, y)
  signatureBlock(pdf, y + 4, `Verantwortlicher: ${p(v.doctorName || '[Name]')}`)
  docFooter(pdf, 2, 2)
  pdf.save(`DSGVO_Datenschutzerklaerung_${p(v.praxisName || 'Praxis').replace(/\s+/g, '_')}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 11. NIS2 Compliance-Checkliste
// ══════════════════════════════════════════════════════════════════════════════
function generateNIS2(v) {
  const s = loadInvoiceSettings()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const ORANGE = [234, 88, 12]
  pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  const dateStr = v.date ? new Date(v.date).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')
  const CHK = { check: false }
  let y = docHeader(pdf, ORANGE, 'NIS2\nCOMPLIANCE', 'Cybersicherheit · IT-Compliance · Gesundheitswesen', [`Prüfung: ${dateStr}`, p(v.praxisName || '')])

  y = section(pdf, y, '1. Governance & Verantwortlichkeit', ORANGE, [
    { ...CHK, label: 'Informationssicherheitsbeauftragter (ISB) benannt' },
    { ...CHK, label: 'Sicherheitsrichtlinien dokumentiert und aktuell' },
    { ...CHK, label: 'Jährliche Schulungen für alle Mitarbeiter durchgeführt' },
    { ...CHK, label: 'Verantwortlichkeiten für IT-Sicherheit klar geregelt' },
  ])
  y = section(pdf, y, '2. Risikoanalyse & Sicherheitskonzept', ORANGE, [
    { ...CHK, label: 'Risikoanalyse der IT-Systeme durchgeführt (mind. jährlich)' },
    { ...CHK, label: 'Sicherheitskonzept nach BSI Grundschutz oder ISO 27001 vorhanden' },
    { ...CHK, label: 'Kritische Assets identifiziert und inventarisiert' },
    { ...CHK, label: 'Bedrohungsszenarien dokumentiert und bewertet' },
  ])
  y = section(pdf, y, '3. Technische Schutzmaßnahmen', ORANGE, [
    { ...CHK, label: 'Firewalls und Intrusion Detection Systeme (IDS) aktiv' },
    { ...CHK, label: 'Antivirus- und Anti-Malware-Software auf allen Geräten' },
    { ...CHK, label: 'Verschlüsselung sensibler Daten (at rest und in transit)' },
    { ...CHK, label: 'Multi-Faktor-Authentifizierung (MFA) implementiert' },
    { ...CHK, label: 'Patch-Management: Sicherheitsupdates zeitnah eingespielt' },
    { ...CHK, label: 'Netzwerksegmentierung umgesetzt' },
  ])
  docFooter(pdf, 1, 2)

  pdf.addPage(); pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  y = docPage2Header(pdf, ORANGE)
  y = section(pdf, y, '4. Business Continuity & Notfallmanagement', ORANGE, [
    { ...CHK, label: 'Business Continuity Plan (BCP) vorhanden und getestet' },
    { ...CHK, label: 'Regelmäßige Datensicherungen (Backup) mit Wiederherstellungstest' },
    { ...CHK, label: 'Disaster Recovery Plan dokumentiert' },
    { ...CHK, label: 'Notfallkommunikation definiert (wer informiert wen?)' },
  ])
  y = section(pdf, y, '5. Meldepflichten bei Sicherheitsvorfällen', ORANGE, [
    { body: 'Gemäß NIS2: erhebliche Vorfälle innerhalb 24h an BSI melden (incident@bsi.bund.de):' },
    { ...CHK, label: 'Incident Detection und Response Prozess definiert' },
    { ...CHK, label: 'Erstmeldung an BSI innerhalb 24 Stunden bekannt und möglich' },
    { ...CHK, label: 'Folgenbericht innerhalb 72 Stunden möglich' },
    { ...CHK, label: 'Vorfallsprotokoll und Dokumentationsprozess eingerichtet' },
  ])
  y = section(pdf, y, '6. Zugangskontrolle & Identity Management', ORANGE, [
    { ...CHK, label: 'Rollen- und Berechtigungskonzept (least privilege) dokumentiert' },
    { ...CHK, label: 'Starke Passwortrichtlinien (mind. 12 Zeichen)' },
    { ...CHK, label: 'Zugänge ehemaliger Mitarbeiter sofort deaktiviert' },
    { ...CHK, label: 'Privilegierte Zugänge (Admin) separat verwaltet' },
  ])
  y = section(pdf, y, '7. Lieferkettensicherheit', ORANGE, [
    { ...CHK, label: 'IT-Dienstleister auf Sicherheitsanforderungen verpflichtet (AV-Vertrag)' },
    { ...CHK, label: 'Software nur aus vertrauenswürdigen Quellen' },
    { ...CHK, label: 'Cloud-Dienste: DSGVO-konforme Anbieter mit EU-Datenhaltung' },
  ])
  y += 6
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...MID)
  pdf.text(`IT-Berater: ${p(v.berater || `${s.ownerName || 'Branislav Ciric'}, ${s.companyName || 'Brani Digitale Losungen'}`)}`, 14, y)
  y += 5
  pdf.text(`Prüfung: ${dateStr}  |  Praxis: ${p(v.praxisName || '')}  |  Verantw.: ${p(v.doctorName || '')}`, 14, y)
  signatureBlock(pdf, y + 4, 'Unterschrift IT-Berater', 'Unterschrift Praxisinhaber')
  docFooter(pdf, 2, 2)
  pdf.save(`NIS2_Checkliste_${p(v.praxisName || 'Praxis').replace(/\s+/g, '_')}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 12. AV-Vertrag (Art. 28 DSGVO)
// ══════════════════════════════════════════════════════════════════════════════
function generateAVVertrag(v) {
  const s = loadInvoiceSettings()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const GREEN = [5, 150, 105]
  pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  const dateStr = v.date ? new Date(v.date).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')
  const auftragnehmer = `${p(s.companyName || 'Brani Digitale Losungen')}, Inhaber: ${p(s.ownerName || 'Branislav Ciric')}, ${s.email || 'contact@branislavciric.com'}`
  let y = docHeader(pdf, GREEN, 'AUFTRAGSVER-\nARBEITUNG', 'Art. 28 DSGVO · AV-Vertrag · Datenschutz', [`Datum: ${dateStr}`, p(v.clientName || '')])

  y = section(pdf, y, 'Vertragsparteien', GREEN, [
    { heading: 'Auftraggeber (Verantwortlicher):' },
    { body: `${p(v.clientName || '[Praxisname]')}, ${p(v.clientStreet || '[Strasse]')}, ${p(v.clientCity || '[PLZ Stadt]')}` },
    { body: `Vertreten durch: ${p(v.doctorName || '[Name]')}` },
    { heading: 'Auftragnehmer (Auftragsverarbeiter):' },
    { body: auftragnehmer },
  ])
  y = section(pdf, y, '§ 1 Gegenstand und Dauer', GREEN, [
    { body: 'Der Auftragnehmer erbringt IT-Dienstleistungen (IT-Infrastruktur, Wartung, Support, Cybersicherheit) gemäß Dienstleistungsvertrag. Hierbei kann der Auftragnehmer Zugang zu personenbezogenen Daten des Auftraggebers erhalten. Laufzeit: entspricht dem Dienstleistungsvertrag.' },
  ])
  y = section(pdf, y, '§ 2 Weisungsgebundenheit', GREEN, [
    { body: 'Der Auftragnehmer verarbeitet personenbezogene Daten ausschließlich auf dokumentierte Weisung des Auftraggebers. Ohne Weisung erfolgt keine Weitergabe an Dritte. Der Auftragnehmer informiert den Auftraggeber unverzüglich, wenn eine Weisung gegen Datenschutzrecht verstößt.' },
  ])
  y = section(pdf, y, '§ 3 Technische und organisatorische Maßnahmen (TOM)', GREEN, [
    { body: '•  Zugangskontrolle: Passwortschutz, MFA, Bildschirmsperren' },
    { body: '•  Zugriffskontrolle: Rollenbasierte Berechtigungen (least privilege)' },
    { body: '•  Übertragungssicherheit: Verschlüsselung per TLS/SSL' },
    { body: '•  Verfügbarkeitskontrolle: Regelmäßige Backups, Notfallkonzept' },
    { body: '•  Protokollierung: Zugriffe auf kritische Systeme werden dokumentiert' },
  ])
  docFooter(pdf, 1, 2)

  pdf.addPage(); pdf.setFillColor(...WHITE); pdf.rect(0, 0, W, H, 'F')
  y = docPage2Header(pdf, GREEN)
  y = section(pdf, y, '§ 4 Unterauftragnehmer', GREEN, [
    { body: 'Kein Einsatz von Unterauftragnehmern ohne vorherige schriftliche Genehmigung des Auftraggebers. Eingesetzte Unterauftragnehmer werden auf gleichwertige Datenschutzverpflichtungen verpflichtet.' },
  ])
  y = section(pdf, y, '§ 5 Pflichten des Auftragnehmers', GREEN, [
    { body: '•  Wahrung der Vertraulichkeit und Verschwiegenheit gegenüber Dritten' },
    { body: '•  Meldung von Datenschutzverletzungen (Art. 33 DSGVO) innerhalb von 24 Stunden' },
    { body: '•  Unterstützung bei Betroffenenanfragen (Art. 15–22 DSGVO)' },
    { body: '•  Vollständige Löschung oder Rückgabe aller Daten nach Vertragsende' },
    { body: '•  Duldung von Kontrollen durch den Auftraggeber oder beauftragte Dritte' },
  ])
  y = section(pdf, y, '§ 6 Haftung', GREEN, [
    { body: 'Jede Partei haftet für Datenschutzverstöße, die sie zu vertreten hat. Der Auftragnehmer haftet insbesondere bei Nichtbefolgung der Weisungen oder Verfolgung eigener Verarbeitungszwecke.' },
  ])
  y += 10
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MID)
  pdf.text(`Ort / Datum: ___________________________, den ${dateStr}`, 14, y)
  signatureBlock(pdf, y + 4, `${p(v.clientName || '[Auftraggeber]')}  ·  ${p(v.doctorName || '[Name]')}`, `${p(s.companyName || 'Brani Digitale Losungen')}  ·  ${p(s.ownerName || 'Branislav Ciric')}`)
  docFooter(pdf, 2, 2)
  pdf.save(`AV_Vertrag_${p(v.clientName || 'Praxis').replace(/\s+/g, '_')}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// Document catalogue
// ══════════════════════════════════════════════════════════════════════════════
const DOCS = [
  {
    id: 'angebot', title: 'Angebot / Kostenvoranschlag', subtitle: 'Preisangebot · Leistungsübersicht · 1 Seite',
    color: '#0e7490', Icon: FileText, generate: generateAngebot,
    fields: [
      { key: 'clientName',   label: 'Empfänger / Praxis',      placeholder: 'Praxis Dr. Müller' },
      { key: 'clientStreet', label: 'Straße & Hausnummer',     placeholder: 'Musterstraße 1' },
      { key: 'clientCity',   label: 'PLZ & Stadt',              placeholder: '80000 München' },
      { key: 'clientEmail',  label: 'E-Envelope',                   placeholder: 'praxis@example.de' },
      { key: 'angebotNr',    label: 'Angebotsnummer',           placeholder: 'ANG-2025-001' },
      { key: 'date',         label: 'Angebotsdatum',            type: 'date' },
      { key: 'validDays',    label: 'Gültig für (Tage)',        placeholder: '30' },
      { key: 'vatRate',      label: 'MwSt. %',                  placeholder: '19' },
      { key: 'items',        label: 'Leistungspositionen',      type: 'items' },
      { key: 'notes',        label: 'Bemerkungen (opt.)',       placeholder: 'Zahlbar innerhalb von 14 Tagen nach Auftragserteilung.' },
    ],
  },
  {
    id: 'dienstleistung', title: 'IT-Dienstleistungsvertrag', subtitle: 'Hauptvertrag · Rahmenvertrag · 3 Seiten',
    color: '#4f46e5', Icon: FileText, generate: generateDienstleistungsvertrag,
    fields: [
      { key: 'clientName',   label: 'Praxis / Unternehmen',         placeholder: 'Praxis Dr. Müller GmbH' },
      { key: 'clientStreet', label: 'Straße & Hausnummer',           placeholder: 'Musterstraße 1' },
      { key: 'clientCity',   label: 'PLZ & Stadt',                   placeholder: '80000 München' },
      { key: 'doctorName',   label: 'Vertreten durch',               placeholder: 'Dr. Max Müller' },
      { key: 'clientEmail',  label: 'E-Envelope der Praxis',             placeholder: 'praxis@example.de' },
      { key: 'startDate',    label: 'Vertragsbeginn',                type: 'date' },
      { key: 'date',         label: 'Unterzeichnungsdatum',          type: 'date' },
      { key: 'pauschal',     label: 'Monatliche Pauschale € (opt.)', placeholder: '250' },
      { key: 'hourlyRate',   label: 'Stundensatz € (opt.)',          placeholder: '95' },
      { key: 'services',     label: 'Vereinbarte Leistungen',        type: 'services' },
    ],
  },
  {
    id: 'nda', title: 'Geheimhaltungsvereinbarung (NDA)', subtitle: 'Vertraulichkeit · Beiderseitig · 2 Seiten',
    color: '#be123c', Icon: Lock, generate: generateNDA,
    fields: [
      { key: 'clientName',   label: 'Praxis / Unternehmen', placeholder: 'Praxis Dr. Müller' },
      { key: 'clientStreet', label: 'Straße & Hausnummer',   placeholder: 'Musterstraße 1' },
      { key: 'clientCity',   label: 'PLZ & Stadt',           placeholder: '80000 München' },
      { key: 'doctorName',   label: 'Vertreten durch',       placeholder: 'Dr. Max Müller' },
      { key: 'date',         label: 'Datum',                 type: 'date' },
    ],
  },
  {
    id: 'avvertrag', title: 'Auftragsverarbeitungsvertrag', subtitle: 'Art. 28 DSGVO · AV-Vertrag · 2 Seiten',
    color: '#059669', Icon: FileDashed, generate: generateAVVertrag,
    fields: [
      { key: 'clientName',   label: 'Auftraggeber (Praxis)', placeholder: 'Praxis Dr. Müller' },
      { key: 'clientStreet', label: 'Straße & Hausnummer',   placeholder: 'Musterstraße 1' },
      { key: 'clientCity',   label: 'PLZ & Stadt',           placeholder: '80000 München' },
      { key: 'doctorName',   label: 'Vertreten durch',       placeholder: 'Dr. Max Müller' },
      { key: 'date',         label: 'Datum',                 type: 'date' },
    ],
  },
  {
    id: 'sla', title: 'Service Level Agreement (SLA)', subtitle: 'Reaktionszeiten · Verfügbarkeit · 2 Seiten',
    color: '#0284c7', Icon: Gauge, generate: generateSLA,
    fields: [
      { key: 'clientName', label: 'Praxis / Unternehmen',  placeholder: 'Praxis Dr. Müller' },
      { key: 'doctorName', label: 'Ansprechpartner',        placeholder: 'Dr. Max Müller' },
      { key: 'slaLevel',   label: 'SLA-Niveau',             placeholder: 'Standard' },
      { key: 'date',       label: 'Datum',                  type: 'date' },
    ],
  },
  {
    id: 'sepa', title: 'SEPA-Lastschriftmandat', subtitle: 'Einzugsermächtigung · Basislastschrift · 1 Seite',
    color: '#475569', Icon: CreditCard, generate: generateSEPA,
    fields: [
      { key: 'clientName',       label: 'Praxis / Unternehmen',    placeholder: 'Praxis Dr. Müller' },
      { key: 'kontoinhaberName', label: 'Kontoinhaber Name',        placeholder: 'Dr. Max Müller' },
      { key: 'iban',             label: 'IBAN',                     placeholder: 'DE89 3704 0044 0532 0130 00' },
      { key: 'bic',              label: 'BIC',                      placeholder: 'COBADEFFXXX' },
      { key: 'bank',             label: 'Kreditinstitut',           placeholder: 'Commerzbank München' },
      { key: 'mandatsRef',       label: 'Mandatsreferenz (opt.)',   placeholder: 'Auto-generiert' },
      { key: 'erstabbuchung',    label: 'Erste Abbuchung am',       placeholder: '01.02.2025' },
      { key: 'signatureCity',    label: 'Ort der Unterzeichnung',   placeholder: 'München' },
      { key: 'date',             label: 'Datum',                    type: 'date' },
    ],
  },
  {
    id: 'willkommen', title: 'Willkommensschreiben', subtitle: 'Onboarding · Neukunde · 1 Seite',
    color: '#a16700', Icon: Envelope, generate: generateWillkommensschreiben,
    fields: [
      { key: 'clientName',   label: 'Praxis / Unternehmen', placeholder: 'Praxis Dr. Müller' },
      { key: 'clientStreet', label: 'Straße & Hausnummer',   placeholder: 'Musterstraße 1' },
      { key: 'clientCity',   label: 'PLZ & Stadt',           placeholder: '80000 München' },
      { key: 'doctorName',   label: 'Anrede & Name',         placeholder: 'Herrn Dr. Max Müller' },
      { key: 'startDate',    label: 'Leistungsstart',        type: 'date' },
      { key: 'date',         label: 'Datum des Schreibens',  type: 'date' },
    ],
  },
  {
    id: 'bestandsaufnahme', title: 'IT-Bestandsaufnahme', subtitle: 'Ersterfassung · Inventar · 2 Seiten',
    color: '#0d9488', Icon: Monitor, generate: generateITBestandsaufnahme,
    fields: [
      { key: 'clientName',    label: 'Praxis / Unternehmen',  placeholder: 'Praxis Dr. Müller' },
      { key: 'clientStreet',  label: 'Straße & Hausnummer',   placeholder: 'Musterstraße 1' },
      { key: 'clientCity',    label: 'PLZ & Stadt',           placeholder: '80000 München' },
      { key: 'doctorName',    label: 'Ansprechpartner',       placeholder: 'Dr. Max Müller' },
      { key: 'mitarbeiter',   label: 'Anzahl Mitarbeiter',    placeholder: '8' },
      { key: 'praxisSoftware',label: 'Praxissoftware',        placeholder: 'Medistar, Turbomed...' },
      { key: 'betriebssystem',label: 'Betriebssystem',        placeholder: 'Windows 11 Pro' },
      { key: 'antivirus',     label: 'Antivirensoftware',     placeholder: 'Bitdefender, ESET...' },
      { key: 'office365',     label: 'Microsoft 365',         placeholder: 'Business Standard' },
      { key: 'emailSystem',   label: 'E-Envelope-System',         placeholder: 'Outlook / Exchange' },
      { key: 'backupSystem',  label: 'Backup-Lösung',         placeholder: 'Veeam, NAS...' },
      { key: 'cloudDienste',  label: 'Cloud-Dienste',         placeholder: 'OneDrive, SharePoint...' },
      { key: 'probleme',      label: 'Bekannte Probleme',     placeholder: 'z. B. langsames Netzwerk...' },
      { key: 'date',          label: 'Datum der Aufnahme',    type: 'date' },
    ],
  },
  {
    id: 'abnahme', title: 'Abnahmeprotokoll', subtitle: 'Projektabschluss · Unterschrift · 1 Seite',
    color: '#0891b2', Icon: ClipboardText, generate: generateAbnahmeprotokoll,
    fields: [
      { key: 'clientName',         label: 'Praxis / Unternehmen',      placeholder: 'Praxis Dr. Müller' },
      { key: 'doctorName',         label: 'Ansprechpartner',           placeholder: 'Dr. Max Müller' },
      { key: 'projektName',        label: 'Projektbezeichnung',         placeholder: 'NIS2-Implementierung' },
      { key: 'projektBeschreibung',label: 'Kurzbeschreibung',           placeholder: 'Einrichtung Firewall & Security...' },
      { key: 'leistungen',         label: 'Erbrachte Leistungen (kommagetrennt)', placeholder: 'Firewall-Konfiguration, VPN eingerichtet, Dokumentation...' },
      { key: 'anmerkungen',        label: 'Offene Punkte / Anmerkungen (opt.)', placeholder: 'Keine offenen Punkte.' },
      { key: 'date',               label: 'Abnahmedatum',              type: 'date' },
    ],
  },
  {
    id: 'wartung', title: 'Wartungsprotokoll', subtitle: 'IT-Service · Vor Ort / Remote · 1 Seite',
    color: '#6d28d9', Icon: Wrench, generate: generateWartungsprotokoll,
    fields: [
      { key: 'clientName',      label: 'Praxis / Unternehmen',   placeholder: 'Praxis Dr. Müller' },
      { key: 'doctorName',      label: 'Ansprechpartner',        placeholder: 'Dr. Max Müller' },
      { key: 'techniker',       label: 'Techniker / IT-Berater', placeholder: 'Branislav Ciric' },
      { key: 'artDesEinsatzes', label: 'Art des Einsatzes',      placeholder: 'Vor Ort / Remote' },
      { key: 'dauer',           label: 'Dauer des Einsatzes',    placeholder: '2,5 Stunden' },
      { key: 'arbeiten',        label: 'Durchgeführte Arbeiten', placeholder: 'Windows-Updates, Backup-Test, Antivirus-Scan...' },
      { key: 'probleme',        label: 'Festgestellte Probleme (opt.)', placeholder: 'Keine kritischen Probleme festgestellt.' },
      { key: 'teile',           label: 'Verwendete Teile / Lizenzen (opt.)', placeholder: 'Keine.' },
      { key: 'empfehlungen',    label: 'Empfehlungen (opt.)',    placeholder: 'SSD-Austausch empfohlen.' },
      { key: 'naechsterTermin', label: 'Nächster Wartungstermin', type: 'date' },
      { key: 'date',            label: 'Datum des Einsatzes',    type: 'date' },
    ],
  },
  {
    id: 'schulung', title: 'Schulungsprotokoll', subtitle: 'IT-Schulung · Mitarbeiterdokumentation · 1 Seite',
    color: '#b45309', Icon: GraduationCap, generate: generateSchulungsprotokoll,
    fields: [
      { key: 'clientName',     label: 'Praxis / Unternehmen',   placeholder: 'Praxis Dr. Müller' },
      { key: 'doctorName',     label: 'Ansprechpartner',        placeholder: 'Dr. Max Müller' },
      { key: 'schulungsthema', label: 'Schulungsthema',         placeholder: 'DSGVO & IT-Sicherheit für Praxismitarbeiter' },
      { key: 'ort',            label: 'Schulungsort',           placeholder: 'Vor Ort in der Praxis' },
      { key: 'dauer',          label: 'Dauer',                  placeholder: '3 Stunden' },
      { key: 'trainer',        label: 'Trainer / Referent',     placeholder: 'Branislav Ciric' },
      { key: 'inhalt',         label: 'Schulungsinhalt (Stichpunkte)', placeholder: 'DSGVO-Grundlagen, Passwortsicherheit, Phishing-Erkennung...' },
      { key: 'teilnehmer',     label: 'Teilnehmer (kommagetrennt)', placeholder: 'Dr. Müller, Praxishilfe Maria S., ...' },
      { key: 'anmerkungen',    label: 'Anmerkungen (opt.)',     placeholder: '' },
      { key: 'date',           label: 'Datum der Schulung',     type: 'date' },
    ],
  },
  {
    id: 'dsgvo', title: 'Datenschutzerklärung', subtitle: 'Art. 13/14 DSGVO · Patienten · 2 Seiten',
    color: '#2563eb', Icon: Shield, generate: generateDSGVO,
    fields: [
      { key: 'praxisName',   label: 'Name der Praxis',        placeholder: 'Praxis Dr. Müller' },
      { key: 'praxisStreet', label: 'Straße & Hausnummer',    placeholder: 'Musterstraße 1' },
      { key: 'praxisZip',    label: 'PLZ',                    placeholder: '80000' },
      { key: 'praxisCity',   label: 'Stadt',                  placeholder: 'München' },
      { key: 'doctorName',   label: 'Verantwortliche Person', placeholder: 'Dr. Max Müller' },
      { key: 'email',        label: 'E-Envelope der Praxis',      placeholder: 'praxis@example.de' },
      { key: 'phone',        label: 'Telefon',                placeholder: '+49 89 ...' },
      { key: 'website',      label: 'Website (opt.)',          placeholder: 'www.praxis-mueller.de' },
      { key: 'date',         label: 'Stand Datum',            type: 'date' },
    ],
  },
  {
    id: 'nis2', title: 'NIS2 Compliance-Checkliste', subtitle: 'Cybersicherheit · IT-Audit · 2 Seiten',
    color: '#ea580c', Icon: WarningCircle, generate: generateNIS2,
    fields: [
      { key: 'praxisName', label: 'Name der Praxis',        placeholder: 'Praxis Dr. Müller' },
      { key: 'doctorName', label: 'Verantwortliche Person', placeholder: 'Dr. Max Müller' },
      { key: 'date',       label: 'Datum der Prüfung',      type: 'date' },
      { key: 'berater',    label: 'IT-Berater (opt.)',       placeholder: 'Branislav Ciric, Brani Digitale Lösungen' },
    ],
  },
]

// ── Onboarding phases ─────────────────────────────────────────────────────────
const ONBOARDING_PHASES = [
  {
    id: 'phase0',
    title: 'Phase 0 — Angebot',
    timing: 'Vor allem anderen — noch vor dem Vertrag',
    color: '#0e7490',
    docs: ['angebot'],
    desc: 'Erst Angebot schicken, Klient bestätigt, dann geht alles los. Das ist der erste Schritt.',
  },
  {
    id: 'phase1',
    title: 'Phase 1 — Vertragspaket',
    timing: 'Sofort nach Erstgespräch zusenden',
    color: '#4f46e5',
    docs: ['dienstleistung', 'nda', 'avvertrag', 'sla'],
    desc: 'Hauptvertrag, Geheimhaltung, Datenschutz & SLA — alles was vor Leistungsbeginn unterschrieben werden muss.',
  },
  {
    id: 'phase2',
    title: 'Phase 2 — Onboarding',
    timing: 'Tag 1 — gleichzeitig oder per Post',
    color: '#a16700',
    docs: ['willkommen', 'sepa'],
    desc: 'Willkommensschreiben für die Praxis + optionales SEPA-Mandat für automatisches Lastschriftverfahren.',
  },
  {
    id: 'phase3',
    title: 'Phase 3 — Compliance-Paket',
    timing: 'Innerhalb der ersten 2 Wochen',
    color: '#0284c7',
    docs: ['dsgvo', 'nis2'],
    desc: 'Datenschutzerklärung für Patienten + NIS2-Checkliste für den ersten IT-Sicherheits-Audit.',
  },
  {
    id: 'phase4',
    title: 'Phase 4 — Erster Vor-Ort-Termin',
    timing: 'Mitbringen zum ersten Termin',
    color: '#0d9488',
    docs: ['bestandsaufnahme'],
    desc: 'IT-Bestandsaufnahme — vor Ort ausfüllen, inventarisieren, unterschreiben.',
  },
]

const INDIVIDUAL_DOCS = ['wartung', 'abnahme', 'schulung']

function buildValsForDoc(docId, sv) {
  const base = { clientName: sv.clientName, doctorName: sv.doctorName, clientStreet: sv.clientStreet, clientCity: sv.clientCity, clientEmail: sv.clientEmail, date: sv.date, startDate: sv.startDate }
  if (docId === 'dsgvo')  return { ...base, praxisName: sv.clientName, praxisStreet: sv.clientStreet, praxisZip: '', praxisCity: sv.clientCity, email: sv.clientEmail, phone: sv.clientPhone || '' }
  if (docId === 'nis2')   return { ...base, praxisName: sv.clientName }
  if (docId === 'sla')    return { ...base, slaLevel: sv.slaLevel || 'Standard' }
  if (docId === 'sepa')   return { ...base, kontoinhaberName: sv.doctorName, signatureCity: '' }
  return base
}

// ── Form field renderer ────────────────────────────────────────────────────────
const EINHEIT_OPTIONS = ['Pauschal', 'Stunde', 'Tag', 'Monat', 'Stück', 'Lizenz']
const EMPTY_ITEM = () => ({ beschreibung: '', menge: '1', einheit: 'Pauschal', preis: '' })

function renderField(f, vals, setVals, docColor) {
  if (f.type === 'items') {
    const items = Array.isArray(vals[f.key]) ? vals[f.key] : [EMPTY_ITEM(), EMPTY_ITEM(), EMPTY_ITEM()]
    const updateItem = (i, key, val) => setVals(prev => {
      const next = [...(Array.isArray(prev[f.key]) ? prev[f.key] : [EMPTY_ITEM(), EMPTY_ITEM(), EMPTY_ITEM()])]
      next[i] = { ...next[i], [key]: val }
      return { ...prev, [f.key]: next }
    })
    const addItem    = () => setVals(prev => ({ ...prev, [f.key]: [...(Array.isArray(prev[f.key]) ? prev[f.key] : []), EMPTY_ITEM()] }))
    const removeItem = i  => setVals(prev => ({ ...prev, [f.key]: (Array.isArray(prev[f.key]) ? prev[f.key] : []).filter((_, idx) => idx !== i) }))
    const netto = items.reduce((s, it) => s + (parseFloat(it.menge) || 1) * (parseFloat(it.preis) || 0), 0)
    return (
      <div key={f.key} style={{ marginBottom: 14 }}>
        <label className="field-label" style={{ marginBottom: 8, display: 'block' }}>{f.label}</label>
        <div style={{ display: 'grid', gridTemplateColumns: '3.5fr 1fr 1.5fr 1.5fr 28px', gap: 4, marginBottom: 5, padding: '0 2px' }}>
          {['Beschreibung', 'Menge', 'Einheit', 'Preis €', ''].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dimmer)', paddingLeft: 2 }}>{h}</div>
          ))}
        </div>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '3.5fr 1fr 1.5fr 1.5fr 28px', gap: 4, marginBottom: 5 }}>
            <input className="field-input" style={{ margin: 0, fontSize: 12 }} value={item.beschreibung} placeholder={`Position ${i + 1}...`} onChange={e => updateItem(i, 'beschreibung', e.target.value)} />
            <input className="field-input" style={{ margin: 0, fontSize: 12 }} value={item.menge} type="number" min="0" step="0.5" onChange={e => updateItem(i, 'menge', e.target.value)} />
            <select className="field-input" style={{ margin: 0, fontSize: 12 }} value={item.einheit} onChange={e => updateItem(i, 'einheit', e.target.value)}>
              {EINHEIT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <input className="field-input" style={{ margin: 0, fontSize: 12 }} value={item.preis} type="number" min="0" step="0.01" placeholder="0.00" onChange={e => updateItem(i, 'preis', e.target.value)} />
            <button type="button" onClick={() => removeItem(i)}
              style={{ width: 28, height: 38, borderRadius: 8, border: '1px solid var(--card-border)', background: 'var(--card)', color: 'var(--text-dimmer)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>×</button>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <button type="button" onClick={addItem}
            style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${docColor}`, background: 'transparent', color: docColor, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Position hinzufügen
          </button>
          {netto > 0 && (
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>
              Netto: <span style={{ color: docColor }}>{netto.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
            </div>
          )}
        </div>
      </div>
    )
  }
  if (f.type === 'services') {
    const selected = Array.isArray(vals[f.key]) ? vals[f.key] : []
    return (
      <div key={f.key} style={{ marginBottom: 14 }}>
        <label className="field-label" style={{ marginBottom: 8, display: 'block' }}>{f.label}</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {SERVICES_LIST.map(svc => {
            const isOn = selected.includes(svc.key)
            return (
              <button key={svc.key} type="button"
                onClick={() => setVals(prev => ({ ...prev, [f.key]: isOn ? selected.filter(k => k !== svc.key) : [...selected, svc.key] }))}
                style={{ padding: '5px 11px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: isOn ? 700 : 400, border: `1.5px solid ${isOn ? docColor : 'var(--card-border)'}`, background: isOn ? docColor + '22' : 'var(--card)', color: isOn ? docColor : 'var(--text-dim)', transition: 'all 0.15s' }}
              >{svc.label}</button>
            )
          })}
        </div>
        {selected.length === 0 && <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginTop: 6 }}>Mind. eine Leistung wählen → erscheint in § 2 des Vertrages</div>}
      </div>
    )
  }
  return (
    <div className="field" key={f.key} style={{ marginBottom: 10 }}>
      <label className="field-label">{f.label}</label>
      <input className="field-input" type={f.type || 'text'} value={vals[f.key] || ''} placeholder={f.placeholder || ''} onChange={e => setVals(prev => ({ ...prev, [f.key]: e.target.value }))} />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function BDLDocumentsScreen() {
  const [mode, setMode]             = useState('list') // 'list' | 'onboarding' | 'detail'
  const [selected, setSelected]     = useState(null)
  const [vals, setVals]             = useState({})
  const [generating, setGenerating] = useState(false)

  // Onboarding state
  const [sharedVals, setSharedVals]       = useState({})
  const [selDocIds, setSelDocIds]         = useState(new Set())
  const [genProgress, setGenProgress]     = useState(null)
  const [emailShown, setEmailShown]       = useState(false)
  const [emailCopied, setEmailCopied]     = useState(false)

  // Quick-client pickup from Klijenti screen
  useState(() => {
    try {
      const raw = localStorage.getItem('brani_quick_client')
      if (!raw) return
      localStorage.removeItem('brani_quick_client')
      const data = JSON.parse(raw)
      if (data.mode === 'angebot') {
        setMode('detail'); setSelected('angebot')
        setVals({ items: [EMPTY_ITEM(), EMPTY_ITEM(), EMPTY_ITEM()], ...data })
      } else if (data.mode === 'onboarding') {
        setMode('onboarding'); setSharedVals(data)
      }
    } catch {}
  })

  const doc = selected ? DOCS.find(d => d.id === selected) : null

  function toggleDocId(id) {
    setSelDocIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function generateOnboardingPack() {
    const ids = [...selDocIds]
    if (!ids.length) return
    setGenProgress({ done: 0, total: ids.length })
    setEmailShown(false)
    for (let i = 0; i < ids.length; i++) {
      const d = DOCS.find(x => x.id === ids[i])
      if (!d) continue
      try { d.generate(buildValsForDoc(ids[i], sharedVals)) } catch (e) { console.error(e) }
      await new Promise(r => setTimeout(r, 900))
      setGenProgress({ done: i + 1, total: ids.length })
    }
    setGenProgress(null)
    setEmailShown(true)
  }

  function buildEmailText() {
    const s = loadInvoiceSettings()
    const docTitles = [...selDocIds].map(id => DOCS.find(d => d.id === id)?.title).filter(Boolean)
    const greet = sharedVals.doctorName ? `Sehr geehrte/r ${sharedVals.doctorName},` : 'Sehr geehrte Damen und Herren,'
    return `${greet}

vielen Dank für unser Gespräch und Ihr Vertrauen in unsere IT-Dienstleistungen.

Im Anhang finden Sie folgende Unterlagen für unsere Zusammenarbeit:

${docTitles.map(t => `  •  ${t}`).join('\n')}

Bitte prüfen Sie die Unterlagen in Ruhe und senden Sie uns die unterzeichneten Dokumente zurück${sharedVals.clientEmail ? ` an ${sharedVals.clientEmail}` : ''}. Bei Fragen oder Unklarheiten stehe ich Ihnen jederzeit zur Verfügung.

Mit freundlichen Grüßen,
${p(s.ownerName || 'Branislav Ciric')}
${p(s.companyName || 'Brani Digitale Losungen')}
${s.email || 'contact@branislavciric.com'}
${s.website || 'www.branislavciric.com'}`
  }

  function copieEmail() {
    navigator.clipboard.writeText(buildEmailText()).then(() => {
      setEmailCopied(true)
      setTimeout(() => setEmailCopied(false), 2500)
    })
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (mode === 'detail' && doc) return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button onClick={() => { setMode('list'); setSelected(null); setVals({}) }}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: '0 10px 0 0' }}>
          <CaretLeft size={16} /> Zurück
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: doc.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: doc.color }}>
            <doc.Icon size={18} />
          </div>
          <div className="screen-title" style={{ fontSize: 15 }}>{doc.title}</div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 14, background: `linear-gradient(135deg,${doc.color}10,${doc.color}04)`, borderColor: `${doc.color}30` }}>
        <div style={{ fontSize: 11, color: doc.color, fontWeight: 700, marginBottom: 4 }}>📄 {doc.subtitle}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>Felder ausfüllen → Premium-PDF wird generiert, bereit zur Unterschrift.</div>
      </div>
      {doc.fields.map(f => renderField(f, vals, setVals, doc.color))}
      <button className="btn btn-primary"
        style={{ width: '100%', marginTop: 8, fontSize: 14, background: doc.color, borderColor: doc.color }}
        onClick={() => { setGenerating(true); setTimeout(() => { try { doc.generate(vals) } catch (e) { console.error(e) } setGenerating(false) }, 100) }}
        disabled={generating}>
        {generating
          ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Generiere...</>
          : <><DownloadSimple weight="fill" size={16} /> PDF generieren & herunterladen</>}
      </button>
    </div>
  )

  // ── Onboarding view ───────────────────────────────────────────────────────────
  if (mode === 'onboarding') return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button onClick={() => { setMode('list'); setSelDocIds(new Set()); setEmailShown(false) }}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: '0 10px 0 0' }}>
          <CaretLeft size={16} /> Zurück
        </button>
        <div>
          <div className="screen-title" style={{ fontSize: 15 }}>Onboarding-Paket</div>
          <div className="screen-sub">{selDocIds.size} Dokument{selDocIds.size !== 1 ? 'e' : ''} ausgewählt</div>
        </div>
      </div>

      {/* Shared client fields */}
      <div className="card" style={{ marginBottom: 14, borderColor: 'rgba(79,70,229,0.3)', background: 'rgba(79,70,229,0.04)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', marginBottom: 10 }}>Klientendaten — gilt für alle ausgewählten Dokumente</div>
        {[
          { key: 'clientName',   label: 'Praxis / Unternehmen',  placeholder: 'Praxis Dr. Müller' },
          { key: 'doctorName',   label: 'Ansprechpartner / Arzt', placeholder: 'Dr. Max Müller' },
          { key: 'clientStreet', label: 'Straße & Hausnummer',    placeholder: 'Musterstraße 1' },
          { key: 'clientCity',   label: 'PLZ & Stadt',            placeholder: '80000 München' },
          { key: 'clientEmail',  label: 'E-Envelope der Praxis',      placeholder: 'praxis@example.de' },
          { key: 'clientPhone',  label: 'Telefon (opt.)',          placeholder: '+49 89 ...' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 8 }}>
            <label className="field-label">{f.label}</label>
            <input className="field-input" type="text" value={sharedVals[f.key] || ''} placeholder={f.placeholder}
              onChange={e => setSharedVals(prev => ({ ...prev, [f.key]: e.target.value }))} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">Vertragsdatum / Erstellungsdatum</label>
            <input className="field-input" type="date" value={sharedVals.date || ''} onChange={e => setSharedVals(prev => ({ ...prev, date: e.target.value }))} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="field-label">Leistungsstart</label>
            <input className="field-input" type="date" value={sharedVals.startDate || ''} onChange={e => setSharedVals(prev => ({ ...prev, startDate: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Phases */}
      {ONBOARDING_PHASES.map(phase => (
        <div key={phase.id} className="card" style={{ marginBottom: 12, borderColor: phase.color + '30' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: phase.color }}>{phase.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>🕐 {phase.timing}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginTop: 3, lineHeight: 1.5 }}>{phase.desc}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {phase.docs.map(docId => {
              const d = DOCS.find(x => x.id === docId)
              if (!d) return null
              const isOn = selDocIds.has(docId)
              return (
                <button key={docId} type="button" onClick={() => toggleDocId(docId)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${isOn ? phase.color : 'var(--card-border)'}`, background: isOn ? phase.color + '12' : 'var(--card)', transition: 'all 0.15s', textAlign: 'left' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${isOn ? phase.color : 'var(--card-border)'}`, background: isOn ? phase.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {isOn && <div style={{ width: 8, height: 5, borderLeft: '2px solid white', borderBottom: '2px solid white', transform: 'rotate(-45deg) translateY(-1px)' }} />}
                  </div>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: d.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: d.color, flexShrink: 0 }}>
                    <d.Icon size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isOn ? 'var(--text)' : 'var(--text-dim)' }}>{d.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>{d.subtitle}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Individual docs note */}
      <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', borderRadius: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4 }}>Separat ausfüllen (projektspezifisch)</div>
        <div style={{ fontSize: 10, color: 'var(--text-dimmer)', lineHeight: 1.6 }}>
          Wartungsprotokoll · Abnahmeprotokoll · Schulungsprotokoll · SEPA-Lastschriftmandat<br />
          Diese Dokumente brauchen individuelle Daten → über "Alle Dokumente" einzeln generieren.
        </div>
      </div>

      {/* Generate button */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', fontSize: 14, marginBottom: 10, opacity: selDocIds.size === 0 ? 0.5 : 1 }}
        onClick={generateOnboardingPack}
        disabled={selDocIds.size === 0 || genProgress !== null}>
        {genProgress
          ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> {genProgress.done}/{genProgress.total} PDFs werden generiert...</>
          : <><DownloadSimple weight="fill" size={16} /> {selDocIds.size} PDF{selDocIds.size !== 1 ? 's' : ''} generieren & herunterladen</>}
      </button>

      {/* Email template */}
      {emailShown && (
        <div className="card" style={{ borderColor: 'rgba(5,150,105,0.4)', background: 'rgba(5,150,105,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>✓ PDFs bereit — E-Envelope-Vorlage</div>
            <button onClick={copieEmail}
              style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #059669', background: emailCopied ? '#059669' : 'transparent', color: emailCopied ? 'white' : '#059669', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
              {emailCopied ? '✓ Kopiert!' : 'Text kopieren'}
            </button>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginBottom: 8 }}>
            Betreff: <strong style={{ color: 'var(--text-dim)' }}>Ihre IT-Unterlagen – {p(loadInvoiceSettings().companyName || 'Brani Digitale Losungen')}</strong>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'var(--card)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--card-border)', maxHeight: 220, overflowY: 'auto' }}>
            {buildEmailText()}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginTop: 8 }}>
            1. Text kopieren → E-Envelope öffnen → einfügen<br />
            2. Heruntergeladene PDFs als Anhang hinzufügen → absenden
          </div>
        </div>
      )}
    </div>
  )

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">DOKUMENTE</div>
          <div className="screen-title">Rechtsdokumente</div>
          <div className="screen-sub">12 Dokumente · Vollständiger Klientenzyklus · Premium PDF</div>
        </div>
      </div>

      {/* Onboarding CTA */}
      <button onClick={() => { setMode('onboarding'); setEmailShown(false); setSelDocIds(new Set()) }}
        style={{ width: '100%', marginBottom: 14, padding: '14px 16px', borderRadius: 16, border: '1.5px solid rgba(79,70,229,0.5)', background: 'linear-gradient(135deg,rgba(79,70,229,0.12),rgba(79,70,229,0.05))', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
          <Envelope weight="fill" size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#4f46e5' }}>Onboarding-Paket erstellen</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Mehrere Dokumente auswählen, alle auf einmal generieren + E-Envelope-Vorlage</div>
        </div>
        <div style={{ fontSize: 18, color: '#4f46e5' }}>›</div>
      </button>

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dimmer)', letterSpacing: '0.8px', marginBottom: 8, paddingLeft: 4 }}>ALLE DOKUMENTE</div>

      {DOCS.map(d => (
        <div key={d.id} className="card" style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => { setMode('detail'); setSelected(d.id); setVals(d.id === 'angebot' ? { items: [EMPTY_ITEM(), EMPTY_ITEM(), EMPTY_ITEM()] } : {}) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: d.color + '18', border: `1px solid ${d.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: d.color, flexShrink: 0 }}>
              <d.Icon size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>{d.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{d.subtitle}</div>
            </div>
            <div style={{ fontSize: 20, color: 'var(--text-dimmer)', flexShrink: 0 }}>›</div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 8, padding: '12px 14px', background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 12 }}>
        <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginBottom: 3 }}>Tipp: Einstellungen zuerst ausfüllen</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Rechnungen → ⚙ Einstellungen: Logo, IBAN, Steuernummer → erscheinen automatisch in allen 12 PDFs.</div>
      </div>
    </div>
  )
}
