import { useRef, type MouseEvent, type PointerEvent } from 'react'

type Options = {
  onDismiss: () => void // dragged down far / fast enough
  onLeft?: () => void // optional horizontal flicks
  onRight?: () => void
  onUp?: () => void
}

// panel follows the finger while dragging down, then closes or springs back
// attach `ref` to the moving panel and the handlers to the grab area
// (grab area needs css `touch-action: none`)
export function useDragDismiss<T extends HTMLElement>({ onDismiss, onLeft, onRight, onUp }: Options) {
  const ref = useRef<T>(null)
  const drag = useRef<{ x: number; y: number; t: number; axis: 'x' | 'y' | null } | null>(null)
  const moved = useRef(false)

  const reset = () => {
    const el = ref.current
    if (el) {
      el.style.transition = ''
      el.style.transform = ''
    }
  }

  return {
    ref,
    handlers: {
      onPointerDown(e: PointerEvent) {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        if ((e.target as HTMLElement).closest('input, [data-no-drag]')) return
        drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), axis: null }
        moved.current = false
      },
      onPointerMove(e: PointerEvent) {
        const d = drag.current
        if (!d) return
        const dx = e.clientX - d.x
        const dy = e.clientY - d.y

        if (!d.axis) {
          if (Math.hypot(dx, dy) < 8) return
          d.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'
          moved.current = true
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        }

        if (d.axis === 'y' && ref.current) {
          ref.current.style.transition = 'none'
          // a little resistance when pulled up
          ref.current.style.transform = `translateY(${dy > 0 ? dy : dy / 6}px)`
        }
      },
      onPointerUp(e: PointerEvent) {
        const d = drag.current
        drag.current = null
        if (!d?.axis) return

        const dx = e.clientX - d.x
        const dy = e.clientY - d.y
        const speed = dy / Math.max(1, performance.now() - d.t) // px per ms

        reset()
        if (d.axis === 'y') {
          if (dy > 110 || (dy > 30 && speed > 0.5)) onDismiss()
          else if (dy < -50) onUp?.()
        } else if (Math.abs(dx) > 60) {
          if (dx < 0) onLeft?.()
          else onRight?.()
        }
      },
      onPointerCancel() {
        drag.current = null
        reset()
      },
      onClickCapture(e: MouseEvent) {
        if (moved.current) {
          e.stopPropagation()
          e.preventDefault()
          moved.current = false
        }
      },
    },
  }
}
