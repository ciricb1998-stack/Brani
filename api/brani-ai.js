export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message, context, profile, api_key } = req.body
  if (!message) return res.status(400).json({ error: 'no message' })

  const apiKey = process.env.CLAUDE_API_KEY || api_key
  if (!apiKey) return res.status(401).json({ error: 'no api key' })

  const name = profile?.name || 'Branislave'
  const address = profile?.address || 'Branislave'
  const facts = profile?.facts || ''

  const systemPrompt = `Ti si BRANI — personalni AI asistent od ${name}.

Kako se obraćaš:
- Uvijek koristi "${address}" — nikad generički "korisniče" ili "ti"
- Direktan, konkretan, bez praznih fraza
- Motivirajući ali realan i iskren
- Odgovaraj na jeziku kojim te ${name} pita (bosanski, njemački ili engleski)
- Kratki odgovori — maksimalno 3-4 rečenice ako nije traženo drugačije

O korisniku:
${facts}

Trenutni podaci iz appa:
${context || 'Nema podataka.'}

Tvoja uloga:
- Pomozi ${address} da ostane fokusiran na ciljeve
- Upozori kad skače s teme ili prokrastinira
- Pohvali napredak konkretno, ne generički
- Daj jedan sljedeći korak, nikad listu od 10
- Ako nema konkretnog pitanja — daj kratak pregled dana ili motivaciju`

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    })

    const data = await r.json()
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || 'Claude error' })

    const reply = data.content?.[0]?.text || ''
    res.json({ reply })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
