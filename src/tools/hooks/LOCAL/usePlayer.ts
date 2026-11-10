import { useContext } from 'react'
import { PlayerContext } from '../../lib/playerContext'

export function usePlayer() {
  const player = useContext(PlayerContext)
  if (!player) throw new Error('usePlayer must be used inside <PlayerProvider>')
  return player
}
