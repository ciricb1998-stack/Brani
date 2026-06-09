import { saveData, loadData } from './storage.js'

const EMAIL_HISTORY_KEY = 'brani_email_history'

export async function saveGmailEmail(v) {
  saveData('gmail_email', v)
  const { syncSave } = await import('./sync.js')
  syncSave('gmail_email', v)
}
export function loadGmailEmail() { return loadData('gmail_email', '') }

export async function saveGmailPass(v) {
  saveData('gmail_pass', v)
  const { syncSave } = await import('./sync.js')
  syncSave('gmail_pass', v)
}
export function loadGmailPass() { return loadData('gmail_pass', '') }

export function hasGmail() { return !!(loadGmailEmail() && loadGmailPass()) }

export function loadEmailHistory() {
  try { return JSON.parse(localStorage.getItem(EMAIL_HISTORY_KEY) || '[]') } catch { return [] }
}
export function saveEmailToHistory(entry) {
  const history = loadEmailHistory()
  history.unshift({ ...entry, sentAt: new Date().toISOString(), id: Date.now().toString() })
  localStorage.setItem(EMAIL_HISTORY_KEY, JSON.stringify(history.slice(0, 50)))
}
export function deleteEmailFromHistory(id) {
  const history = loadEmailHistory().filter(e => e.id !== id)
  localStorage.setItem(EMAIL_HISTORY_KEY, JSON.stringify(history))
}
export function clearEmailHistory() {
  localStorage.removeItem(EMAIL_HISTORY_KEY)
}

export async function claudeDraftEmail({ context, client, meetings, lang, tone, apiKey }) {
  const langMap = {
    bs: 'bosanski (latinica, forma "Vi")',
    de: 'njemački (Deutsch, Sie-Form, profesionalan poslovni stil)',
    en: 'engleski (profesionalan poslovni stil)',
  }
  const toneMap = {
    formal:  'formalan, profesionalan, distanciran',
    semi:    'polu-formalan, prijatan ali profesionalan',
    direct:  'direktan i koncizan, bez nepotrebnih uvoda',
  }

  // Kontekst o klijentu
  let clientContext = ''
  if (client) {
    clientContext = `
KLIJENT:
- Ime: ${client.name || '—'}
- Firma/Praxis: ${client.practice || '—'}
- Status: ${client.status || '—'}
- Tip: ${client.type || '—'}
- Monatlich: ${client.monthlyValue ? client.monthlyValue + '€' : '—'}
- Usluge: ${client.services || '—'}
- Bilješka: ${client.notes || '—'}`
  }

  // Prethodni meetinzi s klijentom
  let meetingContext = ''
  if (meetings && meetings.length > 0) {
    const recent = meetings.slice(0, 3)
    meetingContext = `\nPRETHODNI MEETINZI S OVIM KLIJENTOM:\n` +
      recent.map(m => {
        const d = m.date ? new Date(m.date).toLocaleDateString('de-DE') : '—'
        return `- ${d}: ${m.title || '—'}${m.notes ? ' | Agenda: ' + m.notes : ''}${m.outcome ? ' | Ishod: ' + m.outcome : ''}${m.nextSteps ? ' | Next: ' + m.nextSteps : ''}`
      }).join('\n')
  }

  const systemPrompt = `Ti si AI asistent za pisanje profesionalnih poslovnih emailova za Branislava Ćirića.

O BRANISLAVU:
- Ime: Branislav Ćirić
- Firma: BRANI Digitale Lösungen
- Sektor: IT i digitalizacija za medicinske prakse (Gesundheitswesen) u Njemačkoj
- Email: ciricb1998@gmail.com
- Usluge: IT infrastruktura, cybersecurity, NIS2, DSGVO compliance, AI consulting, booking sistemi, web razvoj, digitalna arhivizacija
${clientContext}${meetingContext}

PRAVILA:
- Napiši SAMO email tekst — bez subject linije, bez komentara, bez objašnjenja
- ZABRANJEN svaki HTML tag (<p>, <br>, <strong>, <b>, <h1>, itd.) — isključivo plain text
- Prazna linija između paragrafa — bez ikakvih HTML tagova
- Koristiti odgovarajući pozdrav i potpis
- Potpis uvijek: Branislav Ćirić / BRANI Digitale Lösungen / ciricb1998@gmail.com
- Jezik: ${langMap[lang] || langMap.de}
- Ton: ${toneMap[tone] || toneMap.formal}
- Ako postoje prethodni meetinzi — natural reference na njih gdje je relevantno`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Napiši email. Povod / kontekst: ${context}` }],
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Claude greška')
  }

  const data = await res.json()
  return data.content?.[0]?.text?.trim() || ''
}

export async function sendGmailEmail({ to, subject, body, html }) {
  const gmailUser = loadGmailEmail()
  const gmailPass = loadGmailPass()
  if (!gmailUser || !gmailPass) throw new Error('Gmail nije konfigurisan')

  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gmailUser, gmailPass, to, subject, body, html }),
  })

  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.error || 'Greška pri slanju')
  return true
}
