import type { ReactNode, KeyboardEvent } from 'react'
import { cn } from '@/utils/cn'

export interface ForgeCardProps {
  onClick: () => void
  loading?: boolean
  icon?: ReactNode
  title: string
  subtitle?: string
  accent?: 'violet' | 'gold' | 'teal' | 'crimson'
  variant?: 'hero' | 'compact'
  ariaLabel?: string
  className?: string
}

export function ForgeCard({
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
      onClick={() => { if (!loading) onClick() }}
      onKeyDown={handleKeyDown}
      data-accent={accent}
      data-variant={variant}
      className={cn('forge-card', className)}
      style={{ cursor: loading ? 'wait' : 'pointer' }}
    >
      {icon}
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: `var(--${accent})`,
          margin: '0 0 4px',
        }}>
          {loading ? 'Aanmaken...' : title}
        </p>
        {subtitle && (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            {subtitle}
          </p>
        )}
      </div>
    </article>
  )
}
