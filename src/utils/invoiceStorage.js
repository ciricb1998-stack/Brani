import { saveData, loadData } from './storage.js'

const KEY_INVOICES = 'bdl_invoices'
const KEY_OFFERS = 'bdl_offers'
const KEY_SETTINGS = 'bdl_invoice_settings'

export function loadInvoiceSettings() {
  return loadData(KEY_SETTINGS, {
    companyName: 'Brani Digitale Lösungen',
    ownerName: 'Branislav Ćirić',
    street: '',
    city: '',
    zip: '',
    country: 'Deutschland',
    email: 'contact@branislavciric.com',
    website: 'www.branislavciric.com',
    phone: '',
    iban: '',
    bic: '',
    bank: '',
    taxNumber: '',
    vatId: '',
    logo: '',
    nextInvoiceNr: 1,
    nextOfferNr: 1,
  })
}
export function saveInvoiceSettings(s) { saveData(KEY_SETTINGS, s) }

export function loadInvoices() { return loadData(KEY_INVOICES, []) }
export function saveInvoices(list) { saveData(KEY_INVOICES, list) }

export function addInvoice(inv) {
  const list = loadInvoices()
  list.unshift({ ...inv, id: Date.now().toString(), createdAt: new Date().toISOString() })
  saveInvoices(list)
  // bump invoice number
  const s = loadInvoiceSettings()
  saveInvoiceSettings({ ...s, nextInvoiceNr: s.nextInvoiceNr + 1 })
  return list[0]
}

export function deleteInvoice(id) { saveInvoices(loadInvoices().filter(x => x.id !== id)) }

export function loadOffers() { return loadData(KEY_OFFERS, []) }
export function saveOffers(list) { saveData(KEY_OFFERS, list) }

export function addOffer(offer) {
  const list = loadOffers()
  list.unshift({ ...offer, id: Date.now().toString(), createdAt: new Date().toISOString() })
  saveOffers(list)
  const s = loadInvoiceSettings()
  saveInvoiceSettings({ ...s, nextOfferNr: s.nextOfferNr + 1 })
  return list[0]
}

export function deleteOffer(id) { saveOffers(loadOffers().filter(x => x.id !== id)) }

export function calcTotals(items, vatRate = 19) {
  const netto = items.reduce((sum, it) => sum + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0)
  const vat = netto * vatRate / 100
  const brutto = netto + vat
  return { netto, vat, brutto, vatRate }
}

export function formatEur(n) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}
