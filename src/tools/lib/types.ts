// shared shapes

export type Song = {
  id: string // youtube video id, stable across csv edits
  title: string
  artist: string
  url: string
}

export type Playlist = {
  id: string
  name: string
  mood: MoodKey
  songIds: string[]
}

export type MoodKey = 'chill' | 'energy' | 'love' | 'sad' | 'focus' | 'night' | 'party' | 'drive'
