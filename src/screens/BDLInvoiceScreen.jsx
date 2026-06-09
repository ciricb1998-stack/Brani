import { useState, useMemo, useRef } from 'react'
import { useApp } from '../App.jsx'
import {
  Plus, Trash, DownloadSimple, SlidersHorizontal, CaretLeft, Check,
  FileText, X, Package, UploadSimple, Image
} from '@phosphor-icons/react'
import {
  loadInvoices, addInvoice, deleteInvoice,
  loadOffers, addOffer, deleteOffer,
  loadInvoiceSettings, saveInvoiceSettings,
  calcTotals, formatEur,
} from '../utils/invoiceStorage.js'
import { jsPDF } from 'jspdf'

// ── PDF text normalizer — jsPDF Helvetica has no extended Latin support ────────
const p = str => (str == null ? '' : String(str))
  .replace(/Ć/g, 'C').replace(/ć/g, 'c')
  .replace(/Č/g, 'C').replace(/č/g, 'c')
  .replace(/Š/g, 'S').replace(/š/g, 's')
  .replace(/Ž/g, 'Z').replace(/ž/g, 'z')
  .replace(/Đ/g, 'D').replace(/đ/g, 'd')

// ── Premium PDF Generator ──────────────────────────────────────────────────────
function generatePDF(doc, type, s) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, H = 297
  const isInvoice = type === 'invoice'

  // Luxury color palette — dark navy + clean white + blue accent
  const NAVY   = [8,  22,  52]   // deep navy: header, table header, total, footer
  const NAVY2  = [14, 34,  75]   // slightly lighter navy: footer
  const BLUE   = [59, 130, 246]  // accent blue: labels, badge, number highlights
  const DARK   = [15,  23,  42]  // near-black for body text
  const MID    = [60,  72,  90]  // medium grey
  const MUTED  = [110, 124, 145] // muted grey
  const DIM_W  = [155, 170, 198] // muted white on dark backgrounds
  const LIGHT  = [247, 249, 253] // alternating row bg
  const WHITE  = [255, 255, 255]

  const fmt = d => d ? new Date(d).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')

  // ── White page base ──────────────────────────────────────────────────────────
  pdf.setFillColor(...WHITE)
  pdf.rect(0, 0, W, H, 'F')

  // ── HEADER: full-width dark navy band ───────────────────────────────────────
  const headerH = 70
  pdf.setFillColor(...NAVY)
  pdf.rect(0, 0, W, headerH, 'F')

  // Subtle diagonal texture suggestion — thin lighter stripe in header
  pdf.setFillColor(15, 32, 68)
  pdf.rect(0, 0, W, 2, 'F')

  // ── Logo / Monogram ──────────────────────────────────────────────────────────
  const logoX = 14, logoY = 14, logoS = 32
  if (s.logo) {
    try {
      const ext = s.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      pdf.addImage(s.logo, ext, logoX, logoY, logoS, logoS)
    } catch {}
  } else {
    // Monogram pill on dark bg
    pdf.setFillColor(...BLUE)
    pdf.roundedRect(logoX, logoY, logoS, logoS, 6, 6, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(...WHITE)
    const initials = p(s.ownerName || 'BC').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
    pdf.text(initials, logoX + logoS / 2, logoY + logoS / 2 + 5, { align: 'center' })
  }

  // ── Company info (left side of header) ──────────────────────────────────────
  const infoX = 50
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13.5)
  pdf.setTextColor(...WHITE)
  pdf.text(p(s.companyName || 'Brani Digitale Losungen'), infoX, 24)

  const companyLines = [
    p(s.ownerName || 'Branislav Ciric'),
    [p(s.street), [s.zip, p(s.city)].filter(Boolean).join(' ')].filter(Boolean).join(', '),
    s.email || 'contact@branislavciric.com',
    [s.phone, s.website].filter(Boolean).join('  ·  '),
    [s.taxNumber ? `St.-Nr.: ${s.taxNumber}` : null, s.vatId ? `USt-IdNr.: ${s.vatId}` : null].filter(Boolean).join('  ·  '),
  ].filter(Boolean)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.setTextColor(...DIM_W)
  companyLines.forEach((l, i) => pdf.text(l, infoX, 31 + i * 5))

  // ── Document title + meta (right side of header) ─────────────────────────────
  const rX = W - 14
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(28)
  pdf.setTextColor(...WHITE)
  pdf.text(isInvoice ? 'RECHNUNG' : 'ANGEBOT', rX, 26, { align: 'right' })

  // Number badge
  const badgeW = 62
  pdf.setFillColor(...BLUE)
  pdf.roundedRect(rX - badgeW, 30, badgeW, 8, 2, 2, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...WHITE)
  pdf.text(p(`Nr. ${doc.number}`), rX - badgeW / 2, 35.2, { align: 'center' })

  // Dates — muted white
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...DIM_W)
  pdf.text(`Datum:  ${fmt(doc.date)}`, rX, 46, { align: 'right' })
  if (isInvoice && doc.dueDate)
    pdf.text(`Zahlungsziel:  ${fmt(doc.dueDate)}`, rX, 54, { align: 'right' })
  else if (!isInvoice && doc.validUntil)
    pdf.text(`Gultig bis:  ${fmt(doc.validUntil)}`, rX, 54, { align: 'right' })

  // ── Thin accent line at bottom of header ────────────────────────────────────
  pdf.setFillColor(...BLUE)
  pdf.rect(0, headerH - 2, W, 2, 'F')

  // ── Client block ─────────────────────────────────────────────────────────────
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(6.5)
  pdf.setTextColor(...BLUE)
  pdf.text(isInvoice ? 'RECHNUNGSEMPFANGER' : 'AUFTRAGGEBER', 14, 82)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11.5)
  pdf.setTextColor(...DARK)
  pdf.text(p(doc.clientName || '-'), 14, 89)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.setTextColor(...MID)
  const clientInfo = [
    p(doc.clientStreet),
    [doc.clientZip, p(doc.clientCity)].filter(Boolean).join(' '),
    doc.clientCountry && doc.clientCountry !== 'Deutschland' ? p(doc.clientCountry) : null,
  ].filter(Boolean)
  clientInfo.forEach((l, i) => pdf.text(l, 14, 95 + i * 5.5))

  // ── Table ─────────────────────────────────────────────────────────────────────
  const tableTop = Math.max(112, 95 + clientInfo.length * 5.5 + 8)

  // Dark navy table header
  pdf.setFillColor(...NAVY)
  pdf.rect(14, tableTop, W - 28, 10, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7.5)
  pdf.setTextColor(...WHITE)
  const thY = tableTop + 7
  pdf.text('#',                       17.5, thY)
  pdf.text('LEISTUNG / BESCHREIBUNG', 25,   thY)
  pdf.text('MENGE',                   129,  thY, { align: 'right' })
  pdf.text('EINZELPREIS',             158,  thY, { align: 'right' })
  pdf.text('BETRAG',            W - 16, thY, { align: 'right' })

  // ── Items ────────────────────────────────────────────────────────────────────
  let ty = tableTop + 16
  const items = doc.items || []
  items.forEach((item, i) => {
    const qty   = parseFloat(item.qty)   || 0
    const price = parseFloat(item.price) || 0
    const total = qty * price

    // Alternating row highlight
    if (i % 2 === 0) {
      pdf.setFillColor(...LIGHT)
      pdf.rect(14, ty - 5.5, W - 28, 9.5, 'F')
    }

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(...BLUE)
    pdf.text(String(i + 1), 17.5, ty)

    const descLines = pdf.splitTextToSize(p(item.description || ''), 90)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.5)
    pdf.setTextColor(...DARK)
    pdf.text(descLines[0] || '', 25, ty)
    if (descLines[1]) {
      pdf.setFontSize(7.5)
      pdf.setTextColor(...MUTED)
      pdf.text(descLines[1], 25, ty + 4.5)
      ty += 4.5
    }

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.5)
    pdf.setTextColor(...MID)
    pdf.text(`${qty} ${p(item.unit || 'Std.')}`, 129, ty, { align: 'right' })
    pdf.text(formatEur(price),                    158, ty, { align: 'right' })
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...DARK)
    pdf.text(formatEur(total), W - 16, ty, { align: 'right' })
    ty += 10
  })

  // ── Totals ────────────────────────────────────────────────────────────────────
  ty += 2
  pdf.setDrawColor(210, 220, 235)
  pdf.setLineWidth(0.3)
  pdf.line(100, ty, W - 14, ty)
  ty += 7

  const { netto, vat, brutto, vatRate } = calcTotals(items, doc.vatRate ?? 19)
  const txL = 118
  const txR = W - 16

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...MUTED)
  pdf.text('Nettobetrag:',         txL, ty)
  pdf.text(formatEur(netto),       txR, ty, { align: 'right' })
  ty += 6.5
  pdf.text(`MwSt. (${vatRate}%):`, txL, ty)
  pdf.text(formatEur(vat),          txR, ty, { align: 'right' })
  ty += 5

  // Total — full-width navy bar, label left, amount right
  pdf.setFillColor(...NAVY)
  pdf.roundedRect(14, ty, W - 28, 13, 2, 2, 'F')
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.setTextColor(...DIM_W)
  pdf.text('GESAMTBETRAG INKL. MWST.', 19, ty + 8.5)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)
  pdf.setTextColor(...WHITE)
  pdf.text(formatEur(brutto), txR - 2, ty + 9.5, { align: 'right' })
  ty += 19

  // ── Notes ────────────────────────────────────────────────────────────────────
  if (doc.notes) {
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(8)
    pdf.setTextColor(...MUTED)
    const noteLines = pdf.splitTextToSize(p(`Hinweis: ${doc.notes}`), W - 28)
    noteLines.slice(0, 4).forEach(l => { pdf.text(l, 14, ty); ty += 4.5 })
    ty += 4
  }

  // ── Bank details box ─────────────────────────────────────────────────────────
  if (isInvoice && s.iban) {
    const bankH = 36
    const bankY = ty
    pdf.setFillColor(243, 246, 252)
    pdf.roundedRect(14, bankY, W - 28, bankH, 3, 3, 'F')

    // Left blue accent
    pdf.setFillColor(...BLUE)
    pdf.roundedRect(14, bankY, 3.5, bankH, 2, 2, 'F')

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6.5)
    pdf.setTextColor(...BLUE)
    pdf.text('BANKVERBINDUNG', 21, bankY + 9)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8.5)
    pdf.setTextColor(...DARK)
    pdf.text(`IBAN: ${p(s.iban)}`, 21, bankY + 18)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...MID)
    const bicLine = [s.bic ? `BIC: ${s.bic}` : null, s.bank ? p(s.bank) : null].filter(Boolean).join('   ·   ')
    if (bicLine) pdf.text(bicLine, 21, bankY + 26)

    // Verwendungszweck (right column of box)
    const midX = W / 2 + 4
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6.5)
    pdf.setTextColor(...BLUE)
    pdf.text('VERWENDUNGSZWECK', midX, bankY + 9)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(...DARK)
    pdf.text(p(doc.number), midX, bankY + 18)
    if (doc.dueDate) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7.5)
      pdf.setTextColor(...MUTED)
      pdf.text(`Fallig: ${fmt(doc.dueDate)}`, midX, bankY + 26)
    }
    ty = bankY + bankH + 6
  }

  // ── FOOTER: full-width dark navy ─────────────────────────────────────────────
  const footerH = 26
  pdf.setFillColor(...NAVY2)
  pdf.rect(0, H - footerH, W, footerH, 'F')

  // Thin blue accent line at top of footer
  pdf.setFillColor(...BLUE)
  pdf.rect(0, H - footerH, W, 1.5, 'F')

  // Row 1: Company + Owner
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  pdf.setTextColor(...WHITE)
  const footerName = [p(s.companyName || 'Brani Digitale Losungen'), p(s.ownerName || 'Branislav Ciric')].join('   ·   ')
  pdf.text(footerName, W / 2, H - footerH + 9, { align: 'center' })

  // Row 2: IBAN + contact
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6.5)
  pdf.setTextColor(...DIM_W)
  const footerContact = [
    s.iban    ? `IBAN: ${p(s.iban)}` : null,
    s.bic     ? `BIC: ${s.bic}` : null,
    s.email   || 'contact@branislavciric.com',
    s.website || 'www.branislavciric.com',
  ].filter(Boolean).join('   ·   ')
  pdf.text(footerContact, W / 2, H - footerH + 17, { align: 'center' })

  // Page number
  pdf.setFontSize(6)
  pdf.setTextColor(70, 95, 140)
  pdf.text('1 / 1', W - 16, H - footerH + 13, { align: 'right' })

  const filename = `${isInvoice ? 'Rechnung' : 'Angebot'}_${p(doc.number)}_${p(doc.clientName || 'Kunde').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  pdf.save(filename)
}

// ── Logo upload helper ─────────────────────────────────────────────────────────
function readFileAsBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => res(e.target.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

// ── Empty item ─────────────────────────────────────────────────────────────────
const emptyItem = () => ({ description: '', qty: '1', price: '', unit: 'Std.' })
const UNITS = ['Std.', 'Pauschal', 'Stk.', 'Monat', 'Tag', 'km']

// ── Main component ─────────────────────────────────────────────────────────────
export default function BDLInvoiceScreen() {
  const { setScreen } = useApp()
  const [view, setView] = useState('list') // list | form | settings
  const [docType, setDocType] = useState('invoice')
  const [invoices, setInvoices] = useState(loadInvoices)
  const [offers, setOffers] = useState(loadOffers)
  const [settings, setSettings] = useState(loadInvoiceSettings)
  const [settingsDraft, setSettingsDraft] = useState(settings)
  const logoRef = useRef()
  const [tab, setTab] = useState('invoices') // invoices | offers
  const [deleted, setDeleted] = useState(null)

  const nextNr = docType === 'invoice'
    ? `RE-${new Date().getFullYear()}-${String(settings.nextInvoiceNr).padStart(3, '0')}`
    : `AN-${new Date().getFullYear()}-${String(settings.nextOfferNr).padStart(3, '0')}`

  const today = new Date().toISOString().slice(0, 10)
  const dueDefault = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  const validDefault = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

  const [form, setForm] = useState({
    number: nextNr, date: today, dueDate: dueDefault, validUntil: validDefault,
    clientName: '', clientStreet: '', clientCity: '', clientZip: '', clientCountry: 'Deutschland',
    items: [emptyItem()],
    vatRate: 19,
    notes: '',
  })

  function resetForm(type) {
    const s = loadInvoiceSettings()
    const nr = type === 'invoice'
      ? `RE-${new Date().getFullYear()}-${String(s.nextInvoiceNr).padStart(3, '0')}`
      : `AN-${new Date().getFullYear()}-${String(s.nextOfferNr).padStart(3, '0')}`
    setDocType(type)
    setForm({ number: nr, date: today, dueDate: dueDefault, validUntil: validDefault, clientName: '', clientStreet: '', clientCity: '', clientZip: '', clientCountry: 'Deutschland', items: [emptyItem()], vatRate: 19, notes: '' })
    setView('form')
  }

  function setItem(i, field, val) {
    setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [field]: val }; return { ...f, items } })
  }
  function addItem() { setForm(f => ({ ...f, items: [...f.items, emptyItem()] })) }
  function removeItem(i) { setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) })) }

  function saveDoc() {
    if (!form.clientName) return
    const payload = { ...form, type: docType }
    if (docType === 'invoice') { addInvoice(payload); setInvoices(loadInvoices()) }
    else { addOffer(payload); setOffers(loadOffers()) }
    const s = loadInvoiceSettings()
    setSettings(s)
    setSettingsDraft(s)
    generatePDF(payload, docType, s)
    setView('list')
    setTab(docType === 'invoice' ? 'invoices' : 'offers')
  }

  function downloadExisting(doc, type) {
    generatePDF(doc, type, settings)
  }

  function removeDoc(id, type) {
    if (type === 'invoice') { deleteInvoice(id); setInvoices(loadInvoices()) }
    else { deleteOffer(id); setOffers(loadOffers()) }
  }

  function saveSettings() {
    saveInvoiceSettings(settingsDraft)
    setSettings(settingsDraft)
    setView('list')
  }

  const { netto, vat, brutto } = useMemo(() => calcTotals(form.items, form.vatRate), [form.items, form.vatRate])
  const list = tab === 'invoices' ? invoices : offers

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const b64 = await readFileAsBase64(file)
    setSettingsDraft(d => ({ ...d, logo: b64 }))
  }

  // ── SETTINGS VIEW ─────────────────────────────────────────────────────────────
  if (view === 'settings') return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: '0 10px 0 0' }}>
          <CaretLeft size={16} /> Zurück
        </button>
        <div className="screen-title" style={{ flex: 1, fontSize: 16 }}>Firmenadaten & Branding</div>
      </div>

      {/* Logo upload */}
      <div className="card" style={{ marginBottom: 14, background: 'linear-gradient(135deg,rgba(37,99,235,0.06),rgba(37,99,235,0.02))' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '1.2px', marginBottom: 12 }}>LOGO (erscheint auf allen PDFs)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            onClick={() => logoRef.current?.click()}
            style={{ width: 72, height: 72, borderRadius: 14, border: '2px dashed var(--card-border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}
          >
            {settingsDraft.logo
              ? <img src={settingsDraft.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <Image size={24} style={{ color: 'var(--text-dimmer)' }} />
            }
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Firmenlogo hochladen</div>
            <div style={{ fontSize: 11, color: 'var(--text-dimmer)', marginBottom: 8 }}>PNG, JPG oder SVG · Empfohlen: quadratisch</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => logoRef.current?.click()}>
                <UploadSimple weight="fill" size={12} /> UploadSimple
              </button>
              {settingsDraft.logo && (
                <button className="btn btn-outline" style={{ fontSize: 11, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                  onClick={() => setSettingsDraft(d => ({ ...d, logo: '' }))}>
                  <X size={12} /> Entfernen
                </button>
              )}
            </div>
          </div>
        </div>
        <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
      </div>

      {/* Fields */}
      {[
        ['Firmenname', 'companyName', 'Brani Digitale Lösungen'],
        ['Inhaber / Name', 'ownerName', 'Branislav Ćirić'],
        ['Straße & Hausnummer', 'street', 'Musterstraße 1'],
        ['PLZ', 'zip', '80000'],
        ['Stadt', 'city', 'München'],
        ['E-Envelope', 'email', 'contact@branislavciric.com'],
        ['Website', 'website', 'www.branislavciric.com'],
        ['Telefon', 'phone', '+49 ...'],
        ['IBAN', 'iban', 'DE12 3456 7890 1234 5678 90'],
        ['BIC', 'bic', 'XXXXDEXX'],
        ['Bank', 'bank', 'Meine Bank'],
        ['Steuernummer', 'taxNumber', '123/456/78901'],
        ['USt-IdNr.', 'vatId', 'DE123456789'],
        ['Gläubiger-ID (SEPA)', 'creditorId', 'DE98ZZZ00000XXXXXX'],
      ].map(([label, key, ph]) => (
        <div className="field" key={key} style={{ marginBottom: 10 }}>
          <label className="field-label">{label}</label>
          <input className="field-input" value={settingsDraft[key] || ''} placeholder={ph}
            onChange={e => setSettingsDraft(d => ({ ...d, [key]: e.target.value }))} />
        </div>
      ))}
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={saveSettings}>
        <Check size={14} /> Speichern
      </button>
    </div>
  )

  // ── FORM VIEW ─────────────────────────────────────────────────────────────────
  if (view === 'form') return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: '0 10px 0 0' }}>
          <CaretLeft size={16} /> Zurück
        </button>
        <div className="screen-title" style={{ flex: 1, fontSize: 15 }}>
          {docType === 'invoice' ? '🧾 Rechnung' : '📋 Angebot'} erstellen
        </div>
      </div>

      {/* Type toggle */}
      <div className="set-row" style={{ marginBottom: 14 }}>
        {[['invoice', '🧾 Rechnung'], ['offer', '📋 Angebot']].map(([t, l]) => (
          <button key={t} className={`set-btn${docType === t ? ' on' : ''}`} onClick={() => resetForm(t)}>{l}</button>
        ))}
      </div>

      {/* Header info */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '1.2px', marginBottom: 10 }}>
          {docType === 'invoice' ? 'RECHNUNGSDETAILS' : 'ANGEBOTSDETAILS'}
        </div>
        <div className="field-row c2" style={{ marginBottom: 8 }}>
          <div className="field">
            <label className="field-label">Nummer</label>
            <input className="field-input" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} />
          </div>
          <div className="field">
            <label className="field-label">Datum</label>
            <input className="field-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>
        <div className="field-row c2">
          <div className="field">
            <label className="field-label">{docType === 'invoice' ? 'Fällig bis' : 'Gültig bis'}</label>
            <input className="field-input" type="date"
              value={docType === 'invoice' ? form.dueDate : form.validUntil}
              onChange={e => setForm(f => docType === 'invoice' ? { ...f, dueDate: e.target.value } : { ...f, validUntil: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label">MwSt. (%)</label>
            <select className="field-input" value={form.vatRate} onChange={e => setForm(f => ({ ...f, vatRate: Number(e.target.value) }))}>
              <option value={19}>19%</option>
              <option value={7}>7%</option>
              <option value={0}>0% (Kleinunternehmer)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '1.2px', marginBottom: 10 }}>EMPFÄNGER</div>
        <div className="field" style={{ marginBottom: 8 }}>
          <label className="field-label">Name / Praxis</label>
          <input className="field-input" value={form.clientName} placeholder="Dr. Müller / Praxis Musterstraße"
            onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
        </div>
        <div className="field" style={{ marginBottom: 8 }}>
          <label className="field-label">Straße</label>
          <input className="field-input" value={form.clientStreet} placeholder="Musterstraße 1"
            onChange={e => setForm(f => ({ ...f, clientStreet: e.target.value }))} />
        </div>
        <div className="field-row c2">
          <div className="field">
            <label className="field-label">PLZ</label>
            <input className="field-input" value={form.clientZip} placeholder="80000"
              onChange={e => setForm(f => ({ ...f, clientZip: e.target.value }))} />
          </div>
          <div className="field">
            <label className="field-label">Stadt</label>
            <input className="field-input" value={form.clientCity} placeholder="München"
              onChange={e => setForm(f => ({ ...f, clientCity: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '1.2px' }}>POSITIONEN</div>
          <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={addItem}>
            <Plus size={12} /> Hinzufügen
          </button>
        </div>

        {form.items.map((item, i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: i < form.items.length - 1 ? '1px solid var(--card-border)' : 'none', marginBottom: i < form.items.length - 1 ? 8 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dimmer)', width: 20 }}>#{i + 1}</div>
              <input className="field-input" style={{ flex: 1, fontSize: 12 }} value={item.description} placeholder="Leistungsbeschreibung..."
                onChange={e => setItem(i, 'description', e.target.value)} />
              {form.items.length > 1 && (
                <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, marginLeft: 26 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: 'var(--text-dimmer)', marginBottom: 3 }}>Menge</div>
                <input className="field-input" type="number" min="0" step="0.5" style={{ padding: '6px 8px', fontSize: 12 }} value={item.qty}
                  onChange={e => setItem(i, 'qty', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: 'var(--text-dimmer)', marginBottom: 3 }}>Einheit</div>
                <select className="field-input" style={{ padding: '6px 8px', fontSize: 12 }} value={item.unit}
                  onChange={e => setItem(i, 'unit', e.target.value)}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: 'var(--text-dimmer)', marginBottom: 3 }}>Einzelpreis (€)</div>
                <input className="field-input" type="number" min="0" step="0.01" style={{ padding: '6px 8px', fontSize: 12 }} value={item.price} placeholder="0,00"
                  onChange={e => setItem(i, 'price', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: 'var(--text-dimmer)', marginBottom: 3 }}>Gesamt</div>
                <div style={{ padding: '6px 8px', fontSize: 12, fontWeight: 700, color: 'var(--accent)', background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8 }}>
                  {formatEur((parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Totals */}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
            <span>Netto</span><span>{formatEur(netto)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
            <span>MwSt. ({form.vatRate}%)</span><span>{formatEur(vat)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: 'var(--accent)' }}>
            <span>Gesamt</span><span>{formatEur(brutto)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="field" style={{ marginBottom: 14 }}>
        <label className="field-label">Anmerkungen (optional)</label>
        <textarea className="field-input" rows={3} style={{ resize: 'none', fontSize: 12 }} value={form.notes}
          placeholder="Zahlungsbedingungen, Hinweise..." onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>

      <button className="btn btn-primary" style={{ width: '100%', fontSize: 14 }} onClick={saveDoc}
        disabled={!form.clientName || form.items.every(it => !it.price)}>
        <DownloadSimple weight="fill" size={16} /> PDF erstellen & speichern
      </button>
    </div>
  )

  // ── LIST VIEW ─────────────────────────────────────────────────────────────────
  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">RECHNUNGEN</div>
          <div className="screen-title">Rechnungen & Angebote</div>
          <div className="screen-sub">PDF-Generator · Brani Digitale Lösungen</div>
        </div>
        <button onClick={() => { setSettingsDraft(settings); setView('settings') }}
          style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '8px', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex' }}>
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {/* New buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => resetForm('invoice')}>
          <Plus size={14} /> Neue Rechnung
        </button>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => resetForm('offer')}>
          <Plus size={14} /> Neues Angebot
        </button>
      </div>

      {/* Tabs */}
      <div className="set-row" style={{ marginBottom: 14 }}>
        <button className={`set-btn${tab === 'invoices' ? ' on' : ''}`} onClick={() => setTab('invoices')}>
          🧾 Rechnungen ({invoices.length})
        </button>
        <button className={`set-btn${tab === 'offers' ? ' on' : ''}`} onClick={() => setTab('offers')}>
          📋 Angebote ({offers.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-dimmer)', fontSize: 13 }}>
          {tab === 'invoices' ? 'Keine Rechnungen. Erstelle deine erste!' : 'Keine Angebote. Erstelle dein erstes!'}
        </div>
      ) : list.map(doc => {
        const { brutto } = calcTotals(doc.items || [], doc.vatRate ?? 19)
        return (
          <div key={doc.id} className="card" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: tab === 'invoices' ? 'rgba(37,99,235,0.12)' : 'rgba(168,85,247,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {tab === 'invoices' ? <FileText size={18} color="#2563eb" /> : <Package weight="fill" size={18} color="#a855f7" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{doc.clientName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dimmer)', marginTop: 2 }}>
                  {doc.number} · {doc.date}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>
                  {formatEur(brutto)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => downloadExisting(doc, tab === 'invoices' ? 'invoice' : 'offer')}
                  style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'var(--accent)', display: 'flex' }}>
                  <DownloadSimple weight="fill" size={14} />
                </button>
                <button onClick={() => removeDoc(doc.id, tab === 'invoices' ? 'invoice' : 'offer')}
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                  <Trash size={14} />
                </button>
              </div>
            </div>
          </div>
        )
      })}

      {!settings.iban && (
        <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>⚠ Firmenadaten fehlen</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Klicke auf ⚙ oben rechts und trage IBAN, Steuernummer etc. ein — sie erscheinen auf allen PDFs.</div>
        </div>
      )}
    </div>
  )
}
