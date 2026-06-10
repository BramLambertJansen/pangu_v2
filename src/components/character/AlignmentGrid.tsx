import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { ALIGNMENTS } from '@/data/dnd5e'
import { cn } from '@/utils/cn'

export interface AlignmentGridProps {
  value: string | null
  onChange: (alignment: string) => void
  className?: string
}

const FLAT = ALIGNMENTS.flat()

/** 3×3 uitlijningsraster (radiogroup met pijltjesnavigatie). */
export function AlignmentGrid({ value, onChange, className }: AlignmentGridProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const move = (from: number, delta: number) => {
    const next = (from + delta + FLAT.length) % FLAT.length
    refs.current[next]?.focus()
    onChange(FLAT[next])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const deltas: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: 3,
      ArrowUp: -3,
    }
    const delta = deltas[e.key]
    if (delta !== undefined) {
      e.preventDefault()
      move(index, delta)
    }
  }

  return (
    <div role="radiogroup" aria-label="Uitlijning" className={cn('alignment-grid', className)}>
      {FLAT.map((alignment, i) => {
        const selected = value === alignment
        return (
          <button
            key={alignment}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected || (!value && i === 0) ? 0 : -1}
            className="alignment-cell"
            data-selected={selected}
            onClick={() => onChange(alignment)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          >
            {alignment}
          </button>
        )
      })}
    </div>
  )
}
