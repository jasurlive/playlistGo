import { useRef, type MouseEvent, type PointerEvent } from 'react'

// lifting the finger after a long press "clicks" whatever is under it now
// (usually the backdrop of the sheet we just opened), so eat that one click
function swallowNextClick() {
  const eat = (e: Event) => {
    e.stopPropagation()
    e.preventDefault()
  }
  document.addEventListener('click', eat, { capture: true, once: true })
  setTimeout(() => document.removeEventListener('click', eat, { capture: true }), 700)
}

// press and hold (touch) or right click (mouse) -> onLong; the tap that follows is swallowed
export function useLongPress(onLong: () => void, ms = 450) {
  const timer = useRef(0)
  const fired = useRef(false)
  const start = useRef({ x: 0, y: 0 })

  const cancel = () => clearTimeout(timer.current)

  return {
    onPointerDown(e: PointerEvent) {
      if (e.pointerType === 'mouse') return
      fired.current = false
      start.current = { x: e.clientX, y: e.clientY }
      cancel()
      timer.current = window.setTimeout(() => {
        fired.current = true
        navigator.vibrate?.(12)
        swallowNextClick()
        onLong()
      }, ms)
    },
    onPointerMove(e: PointerEvent) {
      if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 10) cancel()
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onClickCapture(e: MouseEvent) {
      if (fired.current) {
        e.stopPropagation()
        e.preventDefault()
        fired.current = false
      }
    },
    onContextMenu(e: MouseEvent) {
      e.preventDefault()
      if (!fired.current) onLong()
    },
  }
}
