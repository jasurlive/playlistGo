import { useSyncExternalStore } from 'react'
import { CHARACTERS, isCharacter, type Character } from '../../lib/characters'

// what Settings saved: one buddy, or 'shuffle' = a random buddy on each visit
export type BuddyChoice = Character | 'shuffle'

// one shared store so the menu and the settings picker stay in sync
const listeners = new Set<() => void>()

const randomBuddy = (not?: Character): Character => {
  const pool = CHARACTERS.filter((c) => c !== not)
  return pool[Math.floor(Math.random() * pool.length)]
}

// rolled once per page load, so the buddy stays the same for the whole visit
let visitBuddy = randomBuddy()

const getChoice = (): BuddyChoice => {
  try {
    const saved = localStorage.getItem('character')
    if (saved === 'shuffle' || isCharacter(saved)) return saved
  } catch {}
  return 'shuffle' // the default: a new buddy each visit
}

const getCharacter = (): Character => {
  const choice = getChoice()
  return choice === 'shuffle' ? visitBuddy : choice
}

const setChoice = (choice: BuddyChoice) => {
  // turning shuffle on rolls a fresh buddy right away, so you see it change
  if (choice === 'shuffle') visitBuddy = randomBuddy(getCharacter())
  try {
    localStorage.setItem('character', choice)
  } catch {}
  listeners.forEach((l) => l())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCharacter() {
  const choice = useSyncExternalStore(subscribe, getChoice)
  const character = useSyncExternalStore(subscribe, getCharacter)
  return { character, choice, setChoice }
}
