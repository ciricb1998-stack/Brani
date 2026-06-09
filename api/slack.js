export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { webhook, text } = req.body || {}
  if (!webhook || !text) return res.status(400).json({ error: 'Missing webhook or text' })
  if (!webhook.startsWith('https://hooks.slack.com/')) {
    return res.status(400).json({ error: 'Invalid webhook URL' })
  }

  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!r.ok) {
      const detail = await r.text()
      return res.status(502).json({ error: 'Slack error', detail })
    }
    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
