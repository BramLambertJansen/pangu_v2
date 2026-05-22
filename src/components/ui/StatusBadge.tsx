import { memo } from 'react'
import { cn } from '@/utils/cn'

export interface StatusBadgeProps {
  label: string
  color: string
  className?: string
}

export const StatusBadge = memo(function StatusBadge({ label, color, className }: StatusBadgeProps) {
  return (
    <span
      className={cn('status-badge', className)}
      style={{ background: color }}
    >
      {label}
    </span>
  )
})
