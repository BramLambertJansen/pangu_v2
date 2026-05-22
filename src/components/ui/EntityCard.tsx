import type { ReactNode, KeyboardEvent } from 'react'
import { cn } from '@/utils/cn'

export interface EntityCardProps {
  children: ReactNode
  onClick: () => void
  ariaLabel: string
  variant?: 'hero' | 'compact'
  className?: string
}

export function EntityCard({ children, onClick, ariaLabel, variant = 'compact', className }: EntityCardProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      data-variant={variant}
      className={cn('entity-card', className)}
    >
      {children}
    </article>
  )
}
