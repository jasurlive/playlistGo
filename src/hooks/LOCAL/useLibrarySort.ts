import { useSyncExternalStore } from 'react'
import type { Song } from '../../lib/types'

// how every library tab (All songs + playlists) is sorted, one shared choice kept in localStorage
// personal = your drag & drop order, recent = newest first, az = by title, shuffle = random (seeded, so it sticks)
export type SortMode = 'personal' | 'recent' | 'az' | 'shuffle'

export const SORTS: { mode: SortMode; label: string }[] = [
  { mode: 'personal', label: 'Personal' },
  { mode: 'recent', label: 'Newly added' },
  { mode: 'az', label: 'A–Z' },
  { mode: 'shuffle', label: 'Shuffled' },
]

const KEY = 'library-sort'
type State = { mode: SortMode; seed: number }

const isMode = (m: unknown): m is SortMode => SORTS.some((s) => s.mode === m)
const newSeed = () => Math.floor(Math.random() * 2 ** 31)

function read(): State {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<State> | null
    if (data && isMode(data.mode)) return { mode: data.mode, seed: Number(data.seed) || newSeed() }
  } catch {}
  return { mode: 'personal', seed: newSeed() }
}

let state = read()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = read()
      emit()
    }
  })
}

function commit(next: State) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {}
  emit()
}

export const librarySortActions = {
  // picking "Shuffled" again deals a new shuffle
  set: (mode: SortMode) =>
    commit({ mode, seed: mode === 'shuffle' && state.mode === 'shuffle' ? newSeed() : state.seed }),
}

export function useLibrarySort() {
  return useSyncExternalStore(subscribe, () => state)
}

// stable pseudo-random rank per song for a seed (FNV-1a), so new songs slot in without reshuffling the rest
function rank(id: string, seed: number) {
  let h = 0x811c9dc5 ^ seed
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193)
  return h >>> 0
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })

// `personal` = the drag & drop order, `recent` = saved songs (newest first) then songs.csv (newest rows on top)
export function sortSongs(personal: Song[], recent: Song[], { mode, seed }: State): Song[] {
  switch (mode) {
    case 'recent':
      return recent
    case 'az':
      return [...personal].sort((a, b) => collator.compare(a.title, b.title) || collator.compare(a.artist, b.artist))
    case 'shuffle':
      return [...personal].sort((a, b) => rank(a.id, seed) - rank(b.id, seed))
    default:
      return personal
  }
}
