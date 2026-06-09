export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url' })

  const decoded = decodeURIComponent(url).trim()
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
  }

  try {
    const pageRes = await fetch(decoded, { headers })
    const html = await pageRes.text()

    const statusCode = pageRes.status
    const contentType = pageRes.headers.get('content-type') || ''
    const htmlLen = html.length
    const hasNextData = html.includes('__NEXT_DATA__')
    const hasCloudflare = html.includes('cloudflare') || html.includes('cf-browser-verification')
    const hasMatches = html.includes('match') || html.includes('Match') || html.includes('Spiel')

    // Extract buildId if Next.js
    const buildIdMatch = html.match(/"buildId"\s*:\s*"([^"]+)"/)
    const buildId = buildIdMatch?.[1] || null

    // Extract first 3000 chars of __NEXT_DATA__ if present
    let nextDataPreview = null
    const ndMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]{0,5000})/)
    if (ndMatch) {
      nextDataPreview = ndMatch[1].slice(0, 3000)
    }

    // Check for API hints in HTML
    const apiHints = []
    const apiMatches = html.matchAll(/["'](\/api\/v\d[^"']{0,100})["']/g)
    for (const m of apiMatches) apiHints.push(m[1])

    return res.json({
      url: decoded,
      statusCode,
      contentType,
      htmlLen,
      hasNextData,
      hasCloudflare,
      hasMatches,
      buildId,
      nextDataPreview,
      apiHints: [...new Set(apiHints)].slice(0, 20),
      htmlPreview: html.slice(0, 1000),
    })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
