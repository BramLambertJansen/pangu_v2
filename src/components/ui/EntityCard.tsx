import { memo, type ReactNode, type KeyboardEvent } from 'react'
import { cn } from '@/utils/cn'

export interface EntityCardProps {
  children: ReactNode
  onClick?: () => void
  ariaLabel: string
  variant?: 'hero' | 'compact'
  className?: string
}

export const EntityCard = memo(function EntityCard({ children, onClick, ariaLabel, variant = 'compact', className }: EntityCardProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <article
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      data-variant={variant}
      className={cn('entity-card', className)}
    >
      {children}
    </article>
  )
})
