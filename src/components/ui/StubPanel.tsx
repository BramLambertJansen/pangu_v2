import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface StubPanelProps {
  title: string
  /** One-line description of what the finished component will do. */
  description?: string
  /** Optional preview/placeholder content. */
  children?: ReactNode
  className?: string
}

/**
 * Visible placeholder for a design-system component that is scaffolded but not
 * yet implemented. Keeps a stable interface so feature work can flesh it out
 * later without API churn. Tracked in docs/design-system/02-feature-backlog.md.
 */
export function StubPanel({ title, description, children, className }: StubPanelProps) {
  return (
    <section className={cn('surface p-5', className)} aria-label={`${title} (in ontwikkeling)`}>
      <header className="mb-3 flex items-center gap-3">
        <span className="badge badge-gold">Binnenkort</span>
        <h3 className="pg-section-title !text-ink-soft">{title}</h3>
      </header>
      {description && <p className="text-sm text-muted">{description}</p>}
      {children}
    </section>
  )
}
