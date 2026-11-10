import { useEffect, useState } from 'react'
import { usePlayer } from './usePlayer'

// current time / duration of the playing video, polled while `enabled`
export function useProgress(enabled = true) {
  const { getTime, getDuration, playing, current } = usePlayer()
  const [progress, setProgress] = useState({ time: 0, duration: 0 })

  useEffect(() => {
    if (!enabled) return
    const tick = () => setProgress({ time: getTime(), duration: getDuration() })
    tick()
    const id = setInterval(tick, playing ? 250 : 1000)
    return () => clearInterval(id)
  }, [enabled, playing, current, getTime, getDuration])

  return progress
}
