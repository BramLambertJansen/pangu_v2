import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'

export interface TabItem {
  id: string
  label: string
}

export interface TabsProps {
  items: TabItem[]
  value: string
  onValueChange: (id: string) => void
  /** Accessible label for the tablist. */
  label?: string
  className?: string
}

/**
 * Pill tab bar with a sliding `.tab-indicator`. Roving arrow-key navigation and
 * `aria-selected` are handled here; visuals come from the token-driven classes.
 */
export function Tabs({ items, value, onValueChange, label, className }: TabsProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const active = bar.querySelector<HTMLButtonElement>(`[data-tab-id="${value}"]`)
    if (active) setIndicator({ left: active.offsetLeft, width: active.offsetWidth })
  }, [value, items])

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
      className={cn('tab-bar relative', className)}
      onKeyDown={onKeyDown}
    >
      {indicator && (
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
