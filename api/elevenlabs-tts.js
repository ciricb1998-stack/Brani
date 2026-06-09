export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { text, voice_id, api_key } = req.body
  if (!text) return res.status(400).json({ error: 'no text' })

  const apiKey = process.env.ELEVENLABS_API_KEY || api_key
  if (!apiKey) return res.status(401).json({ error: 'no api key' })

  const vid = voice_id || 'pNInz6obpgDQGcFmaJgB'

  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
      }),
    })

    if (!r.ok) {
      const err = await r.text()
      return res.status(r.status).json({ error: err })
    }

    const buffer = await r.arrayBuffer()
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    res.send(Buffer.from(buffer))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
