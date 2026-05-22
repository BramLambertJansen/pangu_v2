import { useState, useEffect, useRef } from 'react'

interface Position { x: number; y: number }

interface UseImagePositioningOptions {
  /** Serialised "X% Y%" string from the entity (re-sync when entity loads) */
  initialPosition: string | null | undefined
  /** Called with the new serialised string whenever the position changes */
  onChange: (serialized: string) => void
}

function parse(pos: string | null | undefined): Position {
  if (!pos || pos === 'center') return { x: 50, y: 50 }
  const m = pos.match(/^([\d.]+)%\s+([\d.]+)%$/)
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 50, y: 50 }
}

function serialize(pos: Position): string {
  return `${pos.x.toFixed(1)}% ${pos.y.toFixed(1)}%`
}

export function useImagePositioning({ initialPosition, onChange }: UseImagePositioningOptions) {
  const [imagePos, setImagePos] = useState<Position>(() => parse(initialPosition))
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setImagePos(parse(initialPosition))
  }, [initialPosition])

  useEffect(() => {
    if (!isDragging) return

    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragStartRef.current || !containerRef.current) return
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const rect = containerRef.current.getBoundingClientRect()
      const dx = clientX - dragStartRef.current.mouseX
      const dy = clientY - dragStartRef.current.mouseY
      const newX = Math.max(0, Math.min(100, dragStartRef.current.posX - (dx / rect.width) * 100))
      const newY = Math.max(0, Math.min(100, dragStartRef.current.posY - (dy / rect.height) * 100))
      const newPos = { x: newX, y: newY }
      setImagePos(newPos)
      onChange(serialize(newPos))
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
  }, [isDragging, onChange])

  function handleImageMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, posX: imagePos.x, posY: imagePos.y }
    setIsDragging(true)
  }

  function handleImageTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    dragStartRef.current = { mouseX: t.clientX, mouseY: t.clientY, posX: imagePos.x, posY: imagePos.y }
    setIsDragging(true)
  }

  function handleImageKeyDown(e: React.KeyboardEvent) {
    const step = e.shiftKey ? 10 : 1
    let { x, y } = imagePos
    if (e.key === 'ArrowLeft')  x = Math.max(0, x - step)
    if (e.key === 'ArrowRight') x = Math.min(100, x + step)
    if (e.key === 'ArrowUp')    y = Math.max(0, y - step)
    if (e.key === 'ArrowDown')  y = Math.min(100, y + step)
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault()
      const newPos = { x, y }
      setImagePos(newPos)
      onChange(serialize(newPos))
    }
  }

  return {
    imagePos,
    isDragging,
    containerRef,
    handleImageMouseDown,
    handleImageTouchStart,
    handleImageKeyDown,
  }
}
