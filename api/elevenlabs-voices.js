export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const apiKey = process.env.ELEVENLABS_API_KEY || req.headers['x-elevenlabs-key']
  if (!apiKey) return res.status(401).json({ error: 'no api key' })

  try {
    const r = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
    })
    const data = await r.json()
    if (!r.ok) return res.status(r.status).json({ error: data?.detail?.message || data?.detail || JSON.stringify(data) })
    const voices = (data.voices || []).map(v => ({
      voice_id: v.voice_id,
      name: v.name,
      gender: v.labels?.gender || 'unknown',
      accent: v.labels?.accent || '',
      age: v.labels?.age || '',
      preview_url: v.preview_url,
    }))
    res.json({ voices })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
