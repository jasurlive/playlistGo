import { useGetSongs } from '../GET/useGetSongs'
import { useSavedSongs } from './useSavedSongs'

// the whole library: songs saved from youtube (newest first) + songs.csv
export function useLibrary() {
  const { songs: csv, loading, error } = useGetSongs()
  const saved = useSavedSongs()

  const csvIds = new Set(csv.map((s) => s.id))
  const songs = [...saved.filter((s) => !csvIds.has(s.id)), ...csv]
  const byId = new Map(songs.map((s) => [s.id, s]))

  return {
    songs,
    byId,
    loading,
    error,
    isSaved: (id: string) => !csvIds.has(id) && byId.has(id), // came from youtube, removable
    inLibrary: (id: string) => byId.has(id),
  }
}
