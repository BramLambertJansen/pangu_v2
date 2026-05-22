import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

const itemStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Kruimelpad">
      <ol style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        listStyle: 'none',
        margin: 0,
        padding: 0,
      }}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && (
                <span aria-hidden="true" style={{ ...itemStyle, color: 'var(--hairline)' }}>·</span>
              )}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  style={{ ...itemStyle, color: 'var(--muted)', textDecoration: 'none', transition: 'color var(--t-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  style={{ ...itemStyle, color: isLast ? 'var(--ink-soft)' : 'var(--muted)' }}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
