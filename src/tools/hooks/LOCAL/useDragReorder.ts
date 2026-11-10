import { useCallback, useEffect, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'

// drag-to-reorder for a vertical list, our own (no library):
// - grab the handle (mouse, touch, pen) and the row follows the pointer, the others slide out of the way
// - near the top / bottom edge of the scroll box it auto-scrolls
// - arrow up / down on the focused handle moves one step (keyboard)
// rows are moved with transforms only while dragging; onMove(from, to) fires once on drop
//
// usage: <ol ref={listRef}> rows... <button {...handleProps(i)} /> </ol>
// the list's direct children must be the rows, in order. pair the handle with css `touch-action: none`

type Options = {
  count: number
  onMove: (from: number, to: number) => void
}

type Drag = {
  from: number
  to: number
  pointerId: number
  startY: number
  lastY: number
  scrollBox: HTMLElement | null
  startScroll: number
  rows: HTMLElement[]
  centers: number[] // row centers at the start, in scroll-content coordinates
  step: number // how far the others shift: dragged row height + gap
  frame: number
}

const EDGE = 64 // px from the scroll box edge where auto-scroll starts
const MAX_SPEED = 14 // px per frame at the very edge

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node
  }
  return null
}

// where the dragged row is now and which slot it is over; shifts the rows in between
function layout(d: Drag) {
  const scrolled = (d.scrollBox?.scrollTop ?? 0) - d.startScroll
  const dy = d.lastY - d.startY + scrolled
  const center = d.centers[d.from] + dy

  let to = d.from
  while (to < d.rows.length - 1 && center > d.centers[to + 1]) to++
  while (to > 0 && center < d.centers[to - 1]) to--
  d.to = to

  d.rows.forEach((row, i) => {
    if (i === d.from) {
      row.style.transform = `translateY(${dy}px)`
      return
    }
    const shift = d.from < to && i > d.from && i <= to ? -d.step : d.from > to && i >= to && i < d.from ? d.step : 0
    row.style.transform = shift ? `translateY(${shift}px)` : ''
  })
}

// keeps scrolling while the pointer rests near an edge of the scroll box (one step per frame)
function autoScroll(d: Drag) {
  const box = d.scrollBox
  if (box) {
    const r = box.getBoundingClientRect()
    const speed =
      d.lastY < r.top + EDGE
        ? -MAX_SPEED * Math.min(1, (r.top + EDGE - d.lastY) / EDGE)
        : d.lastY > r.bottom - EDGE
          ? MAX_SPEED * Math.min(1, (d.lastY - (r.bottom - EDGE)) / EDGE)
          : 0
    if (speed) {
      box.scrollTop += speed
      layout(d)
    }
  }
  d.frame = requestAnimationFrame(() => autoScroll(d))
}

export function useDragReorder<T extends HTMLElement = HTMLOListElement>({ count, onMove }: Options) {
  const listRef = useRef<T>(null)
  const drag = useRef<Drag | null>(null)
  const onMoveRef = useRef(onMove)
  useEffect(() => {
    onMoveRef.current = onMove
  })

  const finish = useCallback((commit: boolean) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    cancelAnimationFrame(d.frame)
    d.rows.forEach((row) => {
      row.style.transform = ''
      row.classList.remove('is-dragging', 'is-shifting')
    })
    listRef.current?.classList.remove('is-reordering')
    if (commit && d.to !== d.from) onMoveRef.current(d.from, d.to)
  }, [])

  useEffect(() => () => finish(false), [finish])

  const handleProps = (index: number) => ({
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (e.button !== 0 || drag.current) return
      const list = listRef.current
      if (!list) return
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)

      const rows = Array.from(list.children) as HTMLElement[]
      const scrollBox = scrollParent(list)
      const startScroll = scrollBox?.scrollTop ?? 0
      const rects = rows.map((row) => row.getBoundingClientRect())
      const centers = rects.map((r) => r.top + r.height / 2 + startScroll)
      const next = rects[index + 1] ?? rects[index - 1]
      const step = next ? Math.abs(next.top - rects[index].top) : rects[index].height

      drag.current = {
        from: index,
        to: index,
        pointerId: e.pointerId,
        startY: e.clientY,
        lastY: e.clientY,
        scrollBox,
        startScroll,
        rows,
        centers,
        step,
        frame: 0,
      }
      rows.forEach((row, i) => row.classList.add(i === index ? 'is-dragging' : 'is-shifting'))
      list.classList.add('is-reordering')
      navigator.vibrate?.(8)
      autoScroll(drag.current)
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const d = drag.current
      if (!d || e.pointerId !== d.pointerId) return
      d.lastY = e.clientY
      layout(d)
    },
    onPointerUp(e: PointerEvent<HTMLElement>) {
      if (drag.current?.pointerId === e.pointerId) finish(true)
    },
    onPointerCancel(e: PointerEvent<HTMLElement>) {
      if (drag.current?.pointerId === e.pointerId) finish(false)
    },
    onLostPointerCapture(e: PointerEvent<HTMLElement>) {
      if (drag.current?.pointerId === e.pointerId) finish(true)
    },
    onKeyDown(e: KeyboardEvent<HTMLElement>) {
      if (e.key === 'Escape' && drag.current) {
        e.stopPropagation()
        finish(false)
        return
      }
      const to = e.key === 'ArrowUp' ? index - 1 : e.key === 'ArrowDown' ? index + 1 : -1
      if (to < 0 || to >= count) return
      e.preventDefault()
      onMoveRef.current(index, to)
      // keep focus on the same song's handle after it moved
      requestAnimationFrame(() => {
        const handle = listRef.current?.children[to]?.querySelector<HTMLElement>('[data-drag-handle]')
        handle?.focus()
      })
    },
    onContextMenu(e: MouseEvent<HTMLElement>) {
      e.preventDefault() // long press on the handle is a drag, not the browser / song menu
      e.stopPropagation()
    },
    'data-drag-handle': '',
  })

  return { listRef, handleProps }
}
