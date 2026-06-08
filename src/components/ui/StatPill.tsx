import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface StatPillProps extends ComponentPropsWithoutRef<'div'> {
  /** Leading icon shown in the tinted circle. */
  icon?: ReactNode
  /** The prominent value (e.g. an HP number or AC). */
  value: ReactNode
  /** Uppercase caption rendered after the value. */
  label?: string
}

/** Icon + value + label pill used for compact stat read-outs. */
export function StatPill({ icon, value, label, className, ...props }: StatPillProps) {
  return (
    <div className={cn('stat-pill', className)} {...props}>
      {icon && <span className="ic" aria-hidden="true">{icon}</span>}
      <span className="val pg-mono">{value}</span>
      {label && <span className="lab">{label}</span>}
    </div>
  )
}
