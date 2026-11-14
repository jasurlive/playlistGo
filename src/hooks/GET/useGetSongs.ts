import { useEffect, useState } from 'react'
import type { Song } from '../../lib/types'
import { getVideoId, splitTitle } from '../../lib/youtube'

// the song library lives in public/data/songs.csv (title,url)
const CSV_PATH = '/data/songs.csv'

// split one csv line, honoring "quoted, fields"
function splitLine(line: string): string[] {
  const out: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      out.push(cell)
      cell = ''
    } else cell += ch
  }
  out.push(cell)
  return out.map((c) => c.trim())
}

function parseSongs(text: string): Song[] {
  const [, ...lines] = text.trim().split(/\r?\n/)
  const songs = new Map<string, Song>() // dedupe by video id

  for (const line of lines) {
    const [raw = '', url = ''] = splitLine(line)
    const id = getVideoId(url)
    if (!id || songs.has(id)) continue

    // "Artist - Title" -> split for a nicer two-line row
    songs.set(id, { id, url, ...splitTitle(raw) })
  }
  return [...songs.values()]
}

// fetched once per session and shared by every page
let request: Promise<Song[]> | null = null

function loadSongs() {
  request ??= fetch(CSV_PATH)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.text()
    })
    .then(parseSongs)
    .catch((err: Error) => {
      request = null // allow a retry on the next mount
      throw err
    })
  return request
}

export function useGetSongs() {
  const [state, setState] = useState<{ songs: Song[]; loading: boolean; error: string | null }>({
    songs: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let alive = true
    loadSongs().then(
      (songs) => alive && setState({ songs, loading: false, error: null }),
      (err: Error) => alive && setState({ songs: [], loading: false, error: err.message }),
    )
    return () => {
      alive = false
    }
  }, [])

  return state
}
