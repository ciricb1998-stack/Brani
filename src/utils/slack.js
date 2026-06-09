import { saveData, loadData } from './storage.js'

export async function saveSlackWebhook(url) {
  saveData('slack_webhook', url)
  const { syncSave } = await import('./sync.js')
  syncSave('slack_webhook', url)
}

export function loadSlackWebhook() {
  return loadData('slack_webhook', '')
}

export function hasSlack() {
  return !!loadSlackWebhook()
}

export async function sendToSlack(text) {
  const webhook = loadSlackWebhook()
  if (!webhook) return { ok: false, reason: 'no_webhook' }
  try {
    const res = await fetch('/api/slack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhook, text }),
    })
    if (!res.ok) return { ok: false, reason: 'failed' }
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: e.message }
  }
}

// ── Formatted messages ────────────────────────────────────────────────────────

const SLACK_LABELS = {
  bs: {
    client: 'Klijent', term: 'Termin', type: 'Tip', agenda: 'Agenda', next: 'Sljedeći korak',
    firm: 'Firma', status: 'Status', monthly: 'Mjesečno', note: 'Bilješka',
    morning: 'Jutarnji plan', no_tasks: '(nisu uneti zadaci)', streak: 'Streak',
  },
  de: {
    client: 'Kunde', term: 'Termin', type: 'Typ', agenda: 'Agenda', next: 'Nächster Schritt',
    firm: 'Firma', status: 'Status', monthly: 'Monatlich', note: 'Notiz',
    morning: 'Tagesplan', no_tasks: '(keine Aufgaben)', streak: 'Streak',
  },
  en: {
    client: 'Client', term: 'Date', type: 'Type', agenda: 'Agenda', next: 'Next step',
    firm: 'Company', status: 'Status', monthly: 'Monthly', note: 'Note',
    morning: 'Morning plan', no_tasks: '(no tasks entered)', streak: 'Streak',
  },
}

function getLabels(lang) { return SLACK_LABELS[lang] || SLACK_LABELS.bs }

export function slackMeetingMsg(meeting, lang = 'bs') {
  const l = getLabels(lang)
  const typeEmoji = { call: '📞', video: '🎥', onsite: '🤝', other: '📋' }[meeting.type] || '📋'
  const time = meeting.date ? new Date(meeting.date).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : '—'
  return `📅 *Meeting: ${meeting.title || '—'}*\n${l.client}: ${meeting.clientName || '—'}\n${l.term}: ${time}\n${l.type}: ${typeEmoji}${meeting.notes ? `\n${l.agenda}: ${meeting.notes}` : ''}${meeting.nextSteps ? `\n${l.next}: ${meeting.nextSteps}` : ''}`
}

export function slackClientMsg(client, lang = 'bs') {
  const l = getLabels(lang)
  return `👤 *${l.client}: ${client.name || '—'}*\n${l.firm}: ${client.practice || '—'}\n${l.status}: ${client.status || '—'}\n${l.monthly}: ${client.monthlyValue ? client.monthlyValue + '€' : '—'}${client.notes ? `\n${l.note}: ${client.notes}` : ''}`
}

export function slackEmailMsg(subject, body, recipientName) {
  const preview = body.replace(/\[NAME\]/g, recipientName || '[NAME]').slice(0, 400)
  return `✉️ *Email draft — ${subject}*\n\`\`\`${preview}${body.length > 400 ? '...' : ''}\`\`\``
}

export function slackCaptureMsg(text, tag, lang = 'bs') {
  const emoji = { ideja: '💡', zadatak: '✅', followup: '🔁', licno: '🙋', biznis: '💼' }[tag] || '📝'
  return `${emoji} *Quick Capture*\n${text}`
}

export function slackMorningPlan(tasks, streak, lang = 'bs') {
  const l = getLabels(lang)
  const list = tasks.filter(Boolean).map((t, i) => `${i+1}. ${t}`).join('\n')
  return `☀️ *BRANI System — ${l.morning}*\n${list || l.no_tasks}\n\n🔥 ${l.streak}: ${streak}`
}
