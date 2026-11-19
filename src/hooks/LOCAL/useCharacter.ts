import { useSyncExternalStore } from 'react'
import { isCharacter, type Character } from '../../lib/characters'

// one shared store so the menu, the full player and the settings picker stay in sync
const listeners = new Set<() => void>()

const getCharacter = (): Character => {
  try {
    const saved = localStorage.getItem('character')
    if (isCharacter(saved)) return saved
  } catch {}
  return 'cat'
}

const setCharacter = (character: Character) => {
  try {
    localStorage.setItem('character', character)
  } catch {}
  listeners.forEach((l) => l())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCharacter() {
  const character = useSyncExternalStore(subscribe, getCharacter)
  return { character, setCharacter }
}
