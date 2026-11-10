import type { Playlist } from './types'
import { moodEmoji } from './moods'

// "Playing from …" label for a queue source
export function sourceLabel(source: string | null, playlists: Playlist[]) {
  if (!source || source === 'all') return 'All songs'
  if (source === 'search') return 'Search'
  if (source === 'queue') return 'Queue'
  const p = playlists.find((pl) => pl.id === source)
  return p ? `${moodEmoji(p.mood)} ${p.name || 'Untitled'}` : 'Playlist'
}
