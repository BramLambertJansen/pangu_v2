import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface TabItem {
  id: string
  label: ReactNode
}

export interface TabsProps {
  items: TabItem[]
  value: string
  onValueChange: (id: string) => void
  /** Accessible label for the tablist. */
  label?: string
  /** `pill` (default) renders the sliding-indicator pill bar; `line` renders an underline bar. */
  variant?: 'pill' | 'line'
  className?: string
}

/**
 * Token-driven tab bar. `pill` mode shows a sliding `.tab-indicator`; `line` mode
 * shows an underline. Roving arrow-key navigation and `aria-selected` are handled here.
 */
export function Tabs({ items, value, onValueChange, label, variant = 'pill', className }: TabsProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    if (variant === 'line') return
    const bar = barRef.current
    if (!bar) return
    const active = bar.querySelector<HTMLButtonElement>(`[data-tab-id="${value}"]`)
    if (active) setIndicator({ left: active.offsetLeft, width: active.offsetWidth })
  }, [value, items, variant])

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = items.findIndex((t) => t.id === value)
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const next = e.key === 'ArrowRight' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length
      onValueChange(items[next].id)
    }
  }

  return (
    <div
      ref={barRef}
      role="tablist"
      aria-label={label}
      data-variant={variant}
      className={cn('tab-bar relative', className)}
      onKeyDown={onKeyDown}
    >
      {variant === 'pill' && indicator && (
        <span className="tab-indicator" style={{ left: indicator.left, width: indicator.width }} aria-hidden="true" />
      )}
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          data-tab-id={t.id}
          aria-selected={t.id === value}
          tabIndex={t.id === value ? 0 : -1}
          className="tab"
          onClick={() => onValueChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
