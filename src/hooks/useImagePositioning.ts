import { useState, useRef, useEffect, useCallback } from 'react'

interface Position {
  x: number
  y: number
}

interface ImagePositioningResult {
  containerRef: React.RefObject<HTMLDivElement | null>
  posString: string
  isDragging: boolean
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void
    onTouchStart: (e: React.TouchEvent) => void
    onKeyDown: (e: React.KeyboardEvent) => void
  }
}

function parsePosition(pos: string | null | undefined): Position {
  if (!pos || pos === 'center') return { x: 50, y: 50 }
  const m = pos.match(/^([\d.]+)%\s+([\d.]+)%$/)
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 50, y: 50 }
}

function serializePosition(pos: Position): string {
  return `${pos.x.toFixed(1)}% ${pos.y.toFixed(1)}%`
}

export function useImagePositioning(
  initial: string | null | undefined,
  onChange: (posString: string) => void,
): ImagePositioningResult {
  const [imagePos, setImagePos] = useState<Position>(() => parsePosition(initial))
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync when initial changes (e.g. after data loads)
  useEffect(() => {
    setImagePos(parsePosition(initial))
  }, [initial])

  const updatePos = useCallback((newPos: Position) => {
    setImagePos(newPos)
    onChange(serializePosition(newPos))
  }, [onChange])

  useEffect(() => {
    if (!isDragging) return

    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragStartRef.current || !containerRef.current) return
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const rect = containerRef.current.getBoundingClientRect()
      const dx = clientX - dragStartRef.current.mouseX
      const dy = clientY - dragStartRef.current.mouseY
      const newPos: Position = {
        x: Math.max(0, Math.min(100, dragStartRef.current.posX - (dx / rect.width) * 100)),
        y: Math.max(0, Math.min(100, dragStartRef.current.posY - (dy / rect.height) * 100)),
      }
      updatePos(newPos)
    }

    function onUp() {
      setIsDragging(false)
      dragStartRef.current = null
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onUp)
    document.addEventListener('touchcancel', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
      document.removeEventListener('touchcancel', onUp)
    }
  }, [isDragging, updatePos])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, posX: imagePos.x, posY: imagePos.y }
    setIsDragging(true)
  }, [imagePos])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    dragStartRef.current = { mouseX: t.clientX, mouseY: t.clientY, posX: imagePos.x, posY: imagePos.y }
    setIsDragging(true)
  }, [imagePos])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = 5
    const dirs: Record<string, { dx: number; dy: number }> = {
      ArrowLeft:  { dx: -step, dy: 0 },
      ArrowRight: { dx:  step, dy: 0 },
      ArrowUp:    { dx: 0, dy: -step },
      ArrowDown:  { dx: 0, dy:  step },
    }
    const delta = dirs[e.key]
    if (!delta) return
    e.preventDefault()
    setImagePos((prev) => {
      const newPos: Position = {
        x: Math.max(0, Math.min(100, prev.x + delta.dx)),
        y: Math.max(0, Math.min(100, prev.y + delta.dy)),
      }
      onChange(serializePosition(newPos))
      return newPos
    })
  }, [onChange])

  return {
    containerRef,
    posString: serializePosition(imagePos),
    isDragging,
    handlers: { onMouseDown, onTouchStart, onKeyDown },
  }
}
