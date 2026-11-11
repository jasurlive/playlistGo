import { useGetSongs } from '../GET/useGetSongs'
import { useSavedSongs } from './useSavedSongs'
import { applyOrder, useLibraryOrder } from './useLibraryOrder'

// the whole library: songs saved from youtube (newest first) + songs.csv, in your drag & drop order if any
export function useLibrary() {
  const { songs: csv, loading, error } = useGetSongs()
  const saved = useSavedSongs()
  const order = useLibraryOrder()

  const csvIds = new Set(csv.map((s) => s.id))
  const fresh = saved.filter((s) => !csvIds.has(s.id))
  const recent = [...fresh, ...csv] // songs.csv gets new rows on top, so this is newest first
  const songs = applyOrder(recent, fresh.length, order)
  const byId = new Map(songs.map((s) => [s.id, s]))

  return {
    songs,
    recent,
    byId,
    loading,
    error,
    isSaved: (id: string) => !csvIds.has(id) && byId.has(id), // came from youtube, removable
    inLibrary: (id: string) => byId.has(id),
  }
}
