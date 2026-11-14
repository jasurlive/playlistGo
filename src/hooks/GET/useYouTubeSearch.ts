import { useRef, useState } from 'react'
import type { Song } from '../../lib/types'
import { splitTitle, watchUrl } from '../../lib/youtube'

type Item = { id: string; title: string; channel: string }

// talks to our own /api/search (api/search.ts), which holds the api key
// results are cached per query for the session: every real search costs quota
const cache = new Map<string, Song[]>()

export function useYouTubeSearch() {
  const [results, setResults] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState('')
  const controller = useRef<AbortController | null>(null)

  async function search(query: string) {
    const q = query.trim()
    if (!q || q === searched) return
    setSearched(q)
    setError(null)

    const hit = cache.get(q.toLowerCase())
    if (hit) return setResults(hit)

    controller.current?.abort()
    controller.current = new AbortController()
    setLoading(true)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.current.signal })
      const data = (await res.json().catch(() => ({}))) as { items?: Item[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)

      const songs = (data.items ?? []).map((item) => ({
        id: item.id,
        url: watchUrl(item.id),
        ...splitTitle(item.title, item.channel),
      }))
      cache.set(q.toLowerCase(), songs)
      setResults(songs)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setResults([])
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return { results, loading, error, searched, search }
}
