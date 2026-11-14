import { useSyncExternalStore } from 'react'
import type { Song } from '../../lib/types'

// songs picked from youtube search, kept in localStorage so playlists can use them
const KEY = 'saved-songs'

function read(): Song[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(data)
      ? data.filter((s): s is Song => typeof s?.id === 'string' && typeof s?.title === 'string')
      : []
  } catch {
    return []
  }
}

let saved = read()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function commit(next: Song[]) {
  saved = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {}
  emit()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      saved = read()
      emit()
    }
  })
}

export const savedActions = {
  // newest first; saving twice is a no-op
  save: (song: Song) => {
    if (!saved.some((s) => s.id === song.id)) {
      const { id, title, artist, url } = song
      commit([{ id, title, artist, url }, ...saved])
    }
  },
  remove: (id: string) => commit(saved.filter((s) => s.id !== id)),
}

export function useSavedSongs() {
  return useSyncExternalStore(subscribe, () => saved)
}
