import { memo, type ReactNode, type KeyboardEvent } from 'react'
import { cn } from '@/utils/cn'

export interface ForgeCardProps {
  onClick: () => void
  loading?: boolean
  icon?: ReactNode
  title: string
  subtitle?: string
  accent?: 'violet' | 'gold' | 'teal' | 'crimson' | 'azure'
  variant?: 'hero' | 'compact'
  ariaLabel?: string
  className?: string
}

export const ForgeCard = memo(function ForgeCard({
  onClick,
  loading,
  icon,
  title,
  subtitle,
  accent = 'gold',
  variant = 'compact',
  ariaLabel,
  className,
}: ForgeCardProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (loading) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={ariaLabel ?? title}
      aria-busy={loading || undefined}
      onClick={() => {
        if (!loading) onClick()
      }}
      onKeyDown={handleKeyDown}
      data-accent={accent}
      data-variant={variant}
      className={cn('forge-card', className)}
    >
      {icon}
      <div className="forge-card-body">
        <p className="forge-card-title">{loading ? 'Aanmaken...' : title}</p>
        {subtitle && <p className="forge-card-subtitle">{subtitle}</p>}
      </div>
    </article>
  )
})
