import { useSyncExternalStore } from 'react'
import type { MoodKey, Playlist } from '../../lib/types'
import { isMood } from '../../lib/moods'

// playlists (the menu tabs) are kept in localStorage, one shared store like useTheme
// other open tabs stay in sync through the `storage` event
const KEY = 'playlists'

const DEFAULTS: Playlist[] = [
  { id: 'chill', name: 'Chill', mood: 'chill', songIds: [] },
  { id: 'energy', name: 'Energy', mood: 'energy', songIds: [] },
]

function read(): Playlist[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return DEFAULTS
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return DEFAULTS
    return data
      .filter((p): p is Playlist => typeof p?.id === 'string' && Array.isArray(p.songIds))
      .map((p) => ({
        id: p.id,
        name: typeof p.name === 'string' ? p.name : 'Untitled',
        mood: isMood(p.mood) ? p.mood : 'chill',
        songIds: p.songIds.filter((s) => typeof s === 'string'),
      }))
  } catch {
    return DEFAULTS
  }
}

let playlists = read()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function commit(next: Playlist[]) {
  playlists = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // private mode / quota: keep working in memory
  }
  emit()
}

const update = (id: string, change: (p: Playlist) => Playlist) =>
  commit(playlists.map((p) => (p.id === id ? change(p) : p)))

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      playlists = read()
      emit()
    }
  })
}

export const playlistActions = {
  create(name = 'New playlist', mood: MoodKey = 'chill', songIds: string[] = []) {
    const id = Math.random().toString(36).slice(2, 9)
    commit([...playlists, { id, name, mood, songIds }])
    return id
  },
  rename: (id: string, name: string) => update(id, (p) => ({ ...p, name })),
  setMood: (id: string, mood: MoodKey) => update(id, (p) => ({ ...p, mood })),
  remove: (id: string) => commit(playlists.filter((p) => p.id !== id)),
  toggleSong: (id: string, songId: string) =>
    update(id, (p) => ({
      ...p,
      songIds: p.songIds.includes(songId)
        ? p.songIds.filter((s) => s !== songId)
        : [...p.songIds, songId],
    })),
  addSongs: (id: string, songIds: string[]) =>
    update(id, (p) => ({ ...p, songIds: [...new Set([...p.songIds, ...songIds])] })),
  // drag & drop order: put songId where toSongId is (ids, not indexes: hidden / missing songs keep their place)
  moveSong: (id: string, songId: string, toSongId: string) =>
    update(id, (p) => {
      const ids = [...p.songIds]
      const from = ids.indexOf(songId)
      const to = ids.indexOf(toSongId)
      if (from < 0 || to < 0 || from === to) return p
      ids.splice(to, 0, ...ids.splice(from, 1))
      return { ...p, songIds: ids }
    }),
  removeSongEverywhere: (songId: string) =>
    commit(playlists.map((p) => ({ ...p, songIds: p.songIds.filter((s) => s !== songId) }))),
  reset: () => commit(DEFAULTS),
}

export function usePlaylists() {
  return useSyncExternalStore(subscribe, () => playlists)
}
