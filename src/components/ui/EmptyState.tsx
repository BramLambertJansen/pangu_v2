import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
        gap: 16,
      }}
    >
      {icon && (
        <div style={{ color: 'var(--subtle)', opacity: 0.7 }}>
          {icon}
        </div>
      )}
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        margin: 0,
      }}>
        {title}
      </p>
      {description && (
        <p style={{
          fontFamily: 'var(--font-quote)',
          fontStyle: 'italic',
          fontSize: 15,
          lineHeight: 1.6,
          color: 'var(--subtle)',
          margin: 0,
          maxWidth: 360,
        }}>
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: 8 }}>
          {action}
        </div>
      )}
    </div>
  )
}
