import { useRef } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
}

export interface SegmentedControlProps<T extends string> {
  /** Accessible group name (announced for the radiogroup). */
  label: string
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  className?: string
}

/**
 * Radiogroup of pill options — for mutually-exclusive settings (theme axes,
 * list filters). Roving tabindex + arrow keys per the WAI-ARIA radio pattern.
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  className,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const move = (delta: number) => {
    const i = options.findIndex((o) => o.value === value)
    const next = (i + delta + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} className={cn('segmented', className)}>
      {options.map((o, i) => {
        const checked = o.value === value
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            disabled={disabled}
            className="segmented-option"
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault()
                move(1)
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault()
                move(-1)
              }
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
