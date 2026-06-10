import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface PickProgressProps {
  count: number
  total: number
  /** Wat er gekozen wordt, meervoud (bv. 'vaardigheden', 'tovertrucs'). */
  itemsLabel: string
  /** Rechts uitgelijnde inhoud (bv. chips van de huidige selectie). */
  children?: ReactNode
  className?: string
}

/** Voortgangspips "x van n gekozen" voor stappen met een vast aantal keuzes. */
export function PickProgress({ count, total, itemsLabel, children, className }: PickProgressProps) {
  const complete = count >= total
  return (
    <div className={cn('pick-progress', className)}>
      <span className="pick-progress-pips" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="pick-pip" data-filled={i < count}>
            {i < count ? '✓' : ''}
          </span>
        ))}
      </span>
      <span className="pick-progress-text" data-complete={complete} role="status">
        {complete
          ? 'Alle keuzes gemaakt'
          : `Nog ${total - count} van ${total} ${itemsLabel} te kiezen`}
      </span>
      {children && <span className="ml-auto flex min-w-0 flex-wrap justify-end gap-1.5">{children}</span>}
    </div>
  )
}
