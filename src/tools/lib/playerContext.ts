import { createContext } from 'react'
import type { Song } from './types'

export type Repeat = 'off' | 'all' | 'one'

export type PlayerApi = {
  queue: Song[]
  index: number
  current: Song | null
  source: string | null // where the queue came from: 'all', 'search', 'queue' or a playlist id
  playing: boolean
  shuffle: boolean
  repeat: Repeat
  error: string | null
  expanded: boolean // full screen player open

  play: (queue: Song[], index: number, source: string) => void
  playAt: (index: number) => void
  playNext: (song: Song) => void
  addToQueue: (song: Song) => void
  removeFromQueue: (index: number) => void
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (seconds: number) => void
  getTime: () => number
  getDuration: () => number
  toggleShuffle: () => void
  cycleRepeat: () => void
  setExpanded: (open: boolean) => void
  setHost: (el: HTMLElement | null) => void // the box the youtube iframe lives in
}

export const PlayerContext = createContext<PlayerApi | null>(null)
