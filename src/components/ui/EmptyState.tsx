import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type EmptyStateVariant = 'default' | 'error'

export interface EmptyStateProps {
  /** Glyph rendered inside the circular badge above the title. */
  icon?: ReactNode
  title: string
  description?: string
  /** Optional italic quote below the description. */
  quote?: string
  /** Action area (typically one or two buttons). */
  action?: ReactNode
  variant?: EmptyStateVariant
  /** Compact horizontal variant for inline list-row placement. */
  inline?: boolean
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  quote,
  action,
  variant = 'default',
  inline = false,
  className,
}: EmptyStateProps) {
  if (inline) {
    return (
      <div className={cn('empty-inline', className)} role="status">
        {icon && <span className="empty-inline-icon" aria-hidden="true">{icon}</span>}
        <div className="empty-inline-body">
          <p className="empty-inline-title">{title}</p>
          {description && <p className="empty-inline-sub">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    )
  }

  return (
    <div
      className={cn('empty', variant === 'error' && 'empty-error', className)}
      role="status"
    >
      {icon && <div className="empty-glyph" aria-hidden="true">{icon}</div>}
      <p className="empty-title">{title}</p>
      {description && <p className="empty-sub">{description}</p>}
      {quote && <p className="empty-quote">&ldquo;{quote}&rdquo;</p>}
      {action && <div className="empty-actions">{action}</div>}
    </div>
  )
}
