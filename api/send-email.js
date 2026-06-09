import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { gmailUser, gmailPass, to, subject, body, html } = req.body || {}
  if (!gmailUser || !gmailPass || !to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if (!to.includes('@')) return res.status(400).json({ error: 'Invalid recipient email' })

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass.replace(/\s/g, '') },
    })
    await transporter.sendMail({
      from: `Branislav Ćirić — BRANI Digitale Lösungen <${gmailUser}>`,
      to,
      subject,
      text: body,
      ...(html ? { html } : {}),
    })
    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
