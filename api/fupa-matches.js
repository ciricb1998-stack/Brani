export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url' })

  const decoded = decodeURIComponent(url).trim()

  const teamMatch = decoded.match(/fupa\.net\/team\/([^/?#]+)/i)
  const clubMatch = decoded.match(/fupa\.net\/club\/([^/?#]+)/i)
  const playerMatch = decoded.match(/fupa\.net\/player\/([^/?#]+)/i)

  const type = teamMatch ? 'team' : clubMatch ? 'club' : playerMatch ? 'player' : null
  const slug = teamMatch?.[1] || clubMatch?.[1] || playerMatch?.[1]

  if (!type || !slug) {
    return res.status(400).json({ error: 'Nevažeći URL. Kopiraj direktni link na igrača, tim ili klub sa fupa.net' })
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
  }

  try {
    if (type === 'player') {
      // Step 1: fetch player profile to extract team slug
      const playerPage = await fetch(`https://www.fupa.net/player/${slug}`, { headers })
      if (!playerPage.ok) {
        return res.status(404).json({ error: `FUPA igrač nije pronađen (${playerPage.status})` })
      }
      const playerHtml = await playerPage.text()
      const rd = extractReduxData(playerHtml)

      // Find all team slugs from player profile (multiple seasons may exist)
      let teamSlugs = []
      if (rd) {
        const allSlugs = collectValues(rd, 'slug', (v) => typeof v === 'string' && /^[a-z0-9-]+-m1-\d{4}-\d{2}$/.test(v))
        // Sort: most recent season first, exclude clearly future seasons
        const nowYear = new Date().getFullYear()
        const sorted = [...new Set(allSlugs)].filter(s => {
          const m = s.match(/-(\d{4})-\d{2}$/)
          return m && parseInt(m[1]) <= nowYear
        }).sort((a, b) => {
          const ya = parseInt(a.match(/-(\d{4})-\d{2}$/)?.[1] || 0)
          const yb = parseInt(b.match(/-(\d{4})-\d{2}$/)?.[1] || 0)
          return yb - ya // descending: most recent first
        })
        teamSlugs = sorted
      }

      if (teamSlugs.length === 0) {
        return res.json({
          ok: false,
          count: 0,
          matches: [],
          error: 'Nije moguće automatski pronaći tim igrača. Pokušaj direktni URL tima (npr. https://www.fupa.net/team/...)',
        })
      }

      // Step 2: try each season slug until we get matches
      for (const teamSlug of teamSlugs) {
        const teamPage = await fetch(`https://www.fupa.net/team/${teamSlug}/matches`, { headers })
        if (!teamPage.ok) continue
        const teamHtml = await teamPage.text()
        const teamRd = extractReduxData(teamHtml)
        const matches = extractMatchesFromRedux(teamRd)
        if (matches.length > 0) {
          return res.json({
            ok: true,
            source: 'fupa_redux_player',
            teamSlug,
            count: matches.length,
            matches,
          })
        }
      }

      return res.json({
        ok: true,
        source: 'fupa_redux_player',
        teamSlug: teamSlugs[0],
        count: 0,
        matches: [],
      })
    }

    if (type === 'team') {
      // Fetch team matches page directly
      const teamPage = await fetch(`https://www.fupa.net/team/${slug}/matches`, { headers })
      if (!teamPage.ok) {
        return res.status(404).json({ error: `Tim nije pronađen na FUPA (${teamPage.status})` })
      }
      const html = await teamPage.text()
      const rd = extractReduxData(html)
      const matches = extractMatchesFromRedux(rd)

      return res.json({
        ok: true,
        source: 'fupa_redux_team',
        count: matches.length,
        matches,
      })
    }

    if (type === 'club') {
      // Try to find main men's team page from club page
      const clubPage = await fetch(`https://www.fupa.net/club/${slug}`, { headers })
      if (!clubPage.ok) {
        return res.status(404).json({ error: `Klub nije pronađen na FUPA (${clubPage.status})` })
      }
      const html = await clubPage.text()
      const rd = extractReduxData(html)

      // Find team slug from club data
      const clubSlugs = collectValues(rd, 'slug', (v) => typeof v === 'string' && /m1-\d{4}-\d{2}$/.test(v))
      const nowY = new Date().getFullYear()
      const teamSlug = clubSlugs
        .filter(s => parseInt(s.match(/-(\d{4})-\d{2}$/)?.[1] || 0) <= nowY)
        .sort((a, b) => {
          const ya = parseInt(a.match(/-(\d{4})-\d{2}$/)?.[1] || 0)
          const yb = parseInt(b.match(/-(\d{4})-\d{2}$/)?.[1] || 0)
          return yb - ya
        })[0] || null

      if (teamSlug) {
        const teamPage = await fetch(`https://www.fupa.net/team/${teamSlug}/matches`, { headers })
        const teamHtml = await teamPage.text()
        const teamRd = extractReduxData(teamHtml)
        const matches = extractMatchesFromRedux(teamRd)
        return res.json({ ok: true, source: 'fupa_redux_club', teamSlug, count: matches.length, matches })
      }

      return res.json({ ok: false, count: 0, matches: [], error: 'Nije moguće pronaći tim od kluba. Pokušaj direktni URL tima.' })
    }

  } catch (e) {
    return res.status(500).json({ error: 'Greška: ' + e.message })
  }
}

// ─── Extract window.REDUX_DATA from HTML ───────────────────────────────────

function extractReduxData(html) {
  const idx = html.indexOf('window.REDUX_DATA = ')
  if (idx === -1) return null

  const jsonStart = html.indexOf('{', idx)
  if (jsonStart === -1) return null

  // Count braces to find end of JSON
  let depth = 0
  let end = -1
  const limit = Math.min(html.length, jsonStart + 800000)

  for (let i = jsonStart; i < limit; i++) {
    const c = html[i]
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }

  if (end === -1) return null

  try {
    return JSON.parse(html.slice(jsonStart, end + 1))
  } catch {
    return null
  }
}

// ─── Extract matches from REDUX_DATA structure ──────────────────────────────

function extractMatchesFromRedux(rd) {
  if (!rd) return []

  // dataHistory is an array, TeamMatchesPage.items holds the matches
  const history = rd.dataHistory
  if (!Array.isArray(history)) return []

  let items = []
  for (const entry of history) {
    const tmp = entry?.TeamMatchesPage?.items
    if (Array.isArray(tmp) && tmp.length > 0) {
      items = tmp
      break
    }
  }

  return dedup(items.map(normalizeFupaMatch).filter(Boolean))
}

// ─── Normalize a single FUPA match object ───────────────────────────────────

function normalizeFupaMatch(g) {
  if (!g || !g.homeTeam || !g.awayTeam) return null

  const homeTeam = g.homeTeam?.name?.full || g.homeTeam?.name?.middle || ''
  const awayTeam = g.awayTeam?.name?.full || g.awayTeam?.name?.middle || ''

  if (!homeTeam && !awayTeam) return null

  const kickoff = g.kickoff || g.date || ''
  const dateStr = kickoff ? new Date(kickoff).toISOString().slice(0, 10) : ''

  const scoreHome = g.homeGoal ?? null
  const scoreAway = g.awayGoal ?? null
  const hasScore = scoreHome !== null && scoreAway !== null

  // section = 'POST' means played, 'PRE' or missing means upcoming
  const sectionPlayed = g.section === 'POST'
  const upcoming = !sectionPlayed || (!hasScore && kickoff && new Date(kickoff) > new Date())

  return {
    id: String(g.id || ''),
    slug: g.slug || '',
    date: dateStr,
    kickoff,
    homeTeam,
    awayTeam,
    homeClubLogo: g.homeTeam?.image?.path || null,
    awayClubLogo: g.awayTeam?.image?.path || null,
    scoreHome: hasScore ? Number(scoreHome) : null,
    scoreAway: hasScore ? Number(scoreAway) : null,
    upcoming,
    competition: g.competition?.name || g.round?.competitionSeason?.name || '',
    matchday: g.round?.title || '',
    fromFupa: true,
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function findDeep(obj, key, valuePredicate, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 8) return null
  if (key in obj) {
    const v = obj[key]
    if (!valuePredicate || valuePredicate(v)) return v
  }
  for (const v of Object.values(obj)) {
    if (typeof v === 'object' && v !== null) {
      const found = findDeep(v, key, valuePredicate, depth + 1)
      if (found !== null && found !== undefined) return found
    }
  }
  return null
}

function collectValues(obj, key, predicate, depth = 0, results = []) {
  if (!obj || typeof obj !== 'object' || depth > 10) return results
  if (key in obj) {
    const v = obj[key]
    if (!predicate || predicate(v)) results.push(v)
  }
  for (const v of Object.values(obj)) {
    if (typeof v === 'object' && v !== null) {
      collectValues(v, key, predicate, depth + 1, results)
    }
  }
  return results
}

function dedup(matches) {
  const seen = new Set()
  return matches.filter(m => {
    const k = `${m.date}_${m.homeTeam}_${m.awayTeam}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  }).sort((a, b) => (a.kickoff || '').localeCompare(b.kickoff || ''))
}
