import { useSyncExternalStore } from 'react'
import type { Song } from '../../lib/types'

// custom order of "All songs" (drag & drop), kept in localStorage as a list of song ids
// songs.csv / saved songs stay the source of truth: ids that are gone are skipped,
// songs that are new since the last reorder show up where they would by default
const KEY = 'library-order'

function read(): string[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(data) ? data.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

let order = read()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      order = read()
      emit()
    }
  })
}

export function useLibraryOrder() {
  return useSyncExternalStore(subscribe, () => order)
}

// default list = saved songs (newest first) then songs.csv; `fresh` = how many leading ones are saved songs
export function applyOrder(songs: Song[], fresh: number, ids: string[]): Song[] {
  if (!ids.length) return songs
  const known = new Set(ids)
  const byId = new Map(songs.map((s) => [s.id, s]))
  const before = songs.slice(0, fresh).filter((s) => !known.has(s.id)) // newly saved from youtube: on top
  const after = songs.slice(fresh).filter((s) => !known.has(s.id)) // new in songs.csv: at the end
  return [...before, ...ids.flatMap((id) => byId.get(id) ?? []), ...after]
}

export const libraryOrderActions = {
  // `visible` is the list exactly as shown, so the stored order matches what you dragged
  move(visible: Song[], from: number, to: number) {
    const ids = visible.map((s) => s.id)
    ids.splice(to, 0, ...ids.splice(from, 1))
    order = ids
    try {
      localStorage.setItem(KEY, JSON.stringify(ids))
    } catch {
      // private mode / quota: keep working in memory
    }
    emit()
  },
}
