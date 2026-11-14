import { useRef, type MouseEvent, type PointerEvent } from 'react'

type Handlers = {
  onLeft?: () => void
  onRight?: () => void
  onUp?: () => void
  onDown?: () => void
}

// quick flick on any element: spread the result onto it
// pair with css `touch-action: none` (or pan-y for horizontal only)
// so the browser doesn't steal the gesture for scrolling
export function useSwipe({ onLeft, onRight, onUp, onDown }: Handlers, threshold = 40) {
  const start = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  return {
    onPointerDown(e: PointerEvent) {
      if (e.pointerType === 'mouse') return
      start.current = { x: e.clientX, y: e.clientY }
      swiped.current = false
    },
    onPointerUp(e: PointerEvent) {
      const s = start.current
      start.current = null
      if (!s) return

      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      const horizontal = Math.abs(dx) > Math.abs(dy) * 1.3

      if (horizontal && Math.abs(dx) > threshold) {
        swiped.current = true
        if (dx < 0) onLeft?.()
        else onRight?.()
      } else if (!horizontal && Math.abs(dy) > threshold) {
        swiped.current = true
        if (dy < 0) onUp?.()
        else onDown?.()
      }
    },
    onPointerCancel() {
      start.current = null
    },
    // a swipe that ends on a button shouldn't also press it
    onClickCapture(e: MouseEvent) {
      if (swiped.current) {
        e.stopPropagation()
        e.preventDefault()
        swiped.current = false
      }
    },
  }
}
