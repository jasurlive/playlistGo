import type { MoodKey } from './types'

// each playlist tab gets a mood: the emoji is its icon in the menu
export const MOODS: { key: MoodKey; emoji: string; label: string }[] = [
  { key: 'chill', emoji: '😌', label: 'Chill' },
  { key: 'energy', emoji: '🔥', label: 'Energy' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'sad', emoji: '🌧️', label: 'Sad' },
  { key: 'focus', emoji: '🎯', label: 'Focus' },
  { key: 'night', emoji: '🌙', label: 'Night' },
  { key: 'party', emoji: '🎉', label: 'Party' },
  { key: 'drive', emoji: '🚗', label: 'Drive' },
]

export const isMood = (value: unknown): value is MoodKey =>
  MOODS.some((m) => m.key === value)

export const moodEmoji = (key: MoodKey) => MOODS.find((m) => m.key === key)?.emoji ?? '🎵'
