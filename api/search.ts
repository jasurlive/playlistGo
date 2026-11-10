// GET /api/search?q=...  -> { items: { id, title, channel }[] }
// vercel function: YOUTUBE_API_KEY stays on the server, never shipped to the browser
// (dev: vite.config.ts serves this same file at /api/search)
//
// - q is a youtube link -> resolved through oEmbed (free, no quota)
// - anything else       -> YouTube Data API search (100 quota units per call)

const LIMIT = 10 // searches per ip per minute, spam protection (per instance, best effort)
const WINDOW = 60_000
const hits = new Map<string, number[]>()

function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > LIMIT
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
const decode = (s: string) =>
  s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e: string) =>
    e[0] === '#'
      ? String.fromCodePoint(parseInt(e[1] === 'x' ? e.slice(2) : e.slice(1), e[1] === 'x' ? 16 : 10))
      : (ENTITIES[e.toLowerCase()] ?? m),
  )

function videoId(q: string): string | null {
  try {
    const u = new URL(q)
    if (!/(^|\.)(youtube\.com|youtu\.be)$/.test(u.hostname)) return null
    if (u.hostname.endsWith('youtu.be')) return u.pathname.slice(1) || null
    return u.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/)?.[2] ?? u.searchParams.get('v')
  } catch {
    return null
  }
}

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (!q) return json({ items: [] })
  if (q.length > 200) return json({ error: 'Query is too long' }, 400)

  const id = videoId(q)
  if (id) {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`,
    )
    if (!res.ok) return json({ error: "That video doesn't exist or can't be embedded" }, 404)
    const data = (await res.json()) as { title: string; author_name: string }
    return json({ items: [{ id, title: data.title, channel: data.author_name }] })
  }

  const key = process.env.YOUTUBE_API_KEY
  if (!key) return json({ error: 'YouTube search is not set up (YOUTUBE_API_KEY missing on the server)' }, 503)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (limited(ip)) return json({ error: 'Too many searches, wait a minute' }, 429)

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.search = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    videoEmbeddable: 'true', // only what can actually play in the app
    maxResults: '25',
    q,
    key,
  }).toString()

  const res = await fetch(url)
  const data = (await res.json()) as {
    items?: { id: { videoId: string }; snippet: { title: string; channelTitle: string } }[]
    error?: { message?: string }
  }
  if (!res.ok) return json({ error: data.error?.message ?? `YouTube error ${res.status}` }, 502)

  const items = (data.items ?? []).map((item) => ({
    id: item.id.videoId,
    title: decode(item.snippet.title),
    channel: decode(item.snippet.channelTitle),
  }))

  // same query again within an hour comes from vercel's cache, not the quota
  return json({ items }, 200, { 'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400' })
}
