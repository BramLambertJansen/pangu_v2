import { Fragment } from 'react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
  onClick?: () => void
}

export type BreadcrumbVariant = 'standard' | 'arcane'

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  /** Optional terminal label rendered as aria-current="page" */
  current?: string
  variant?: BreadcrumbVariant
  /** Denser typography + padding */
  compact?: boolean
  /** Circular back button on the left */
  showBack?: boolean
  onBack?: () => void
  /** Ellipsis-collapse range: hides items[start..end). Negative end counts from the end. */
  collapse?: { start?: number; end?: number }
  /** Optional actions rendered on the right side */
  actions?: React.ReactNode
  className?: string
}

const ChevronSep = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <polyline points="9 6 15 12 9 18" />
  </svg>
)

const BackIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

function Separator({ variant }: { variant: BreadcrumbVariant }) {
  if (variant === 'arcane') {
    return <span className="sep-glyph" aria-hidden="true">✦</span>
  }
  return (
    <li className="sep" aria-hidden="true">
      <ChevronSep />
    </li>
  )
}

function ItemNode({ item }: { item: BreadcrumbItem }) {
  if (item.to) {
    return (
      <Link to={item.to} className="bc-link">
        {item.label}
      </Link>
    )
  }
  if (item.onClick) {
    return (
      <button type="button" className="bc-link bc-link-button" onClick={item.onClick}>
        {item.label}
      </button>
    )
  }
  return <span className="bc-link bc-link-static">{item.label}</span>
}

export function Breadcrumbs({
  items,
  current,
  variant = 'standard',
  compact = false,
  showBack = false,
  onBack,
  collapse,
  actions,
  className,
}: BreadcrumbsProps) {
  const classes = [
    'breadcrumb',
    compact ? 'compact' : null,
    variant === 'arcane' ? 'is-arcane' : null,
    className ?? null,
  ]
    .filter(Boolean)
    .join(' ')

  // Back-compat: if no explicit `current` and the last item has no link/onClick,
  // promote it to current so old call-sites still get aria-current="page".
  let resolvedItems = items
  let resolvedCurrent = current
  if (!resolvedCurrent && items.length > 0) {
    const last = items[items.length - 1]
    if (!last.to && !last.onClick) {
      resolvedItems = items.slice(0, -1)
      resolvedCurrent = last.label
    }
  }

  let beforeItems: BreadcrumbItem[] = resolvedItems
  let collapsedItems: BreadcrumbItem[] = []
  let afterItems: BreadcrumbItem[] = []
  if (collapse) {
    const start = collapse.start ?? 1
    const end = collapse.end ?? -1
    const normalisedEnd = end < 0 ? resolvedItems.length + end : end
    if (normalisedEnd > start && resolvedItems.length > start) {
      beforeItems = resolvedItems.slice(0, start)
      collapsedItems = resolvedItems.slice(start, normalisedEnd)
      afterItems = resolvedItems.slice(normalisedEnd)
    }
  }

  const renderItem = (item: BreadcrumbItem, key: string) => (
    <li key={key}>
      <ItemNode item={item} />
    </li>
  )

  const ol = (
    <ol className={classes} aria-label="Kruimelpad">
      {!collapse &&
        resolvedItems.map((item, i) => (
          <Fragment key={`it-${i}`}>
            {i > 0 && <Separator variant={variant} />}
            {renderItem(item, `it-${i}`)}
          </Fragment>
        ))}

      {collapse && (
        <>
          {beforeItems.map((item, i) => (
            <Fragment key={`b-${i}`}>
              {i > 0 && <Separator variant={variant} />}
              {renderItem(item, `b-${i}`)}
            </Fragment>
          ))}
          {collapsedItems.length > 0 && (
            <>
              {beforeItems.length > 0 && <Separator variant={variant} />}
              <li>
                <div className="bc-ellipsis" tabIndex={0} aria-label="Meer stappen tonen">
                  ···
                  <nav className="bc-dropdown" aria-label="Ingeklapte stappen">
                    {collapsedItems.map((item, i) => {
                      const content = (
                        <>
                          <span className="dd-dot" />
                          {item.label}
                        </>
                      )
                      if (item.to) {
                        return (
                          <Link key={`c-${i}`} to={item.to}>
                            {content}
                          </Link>
                        )
                      }
                      return (
                        <button
                          key={`c-${i}`}
                          type="button"
                          onClick={item.onClick}
                          className="bc-dropdown-button"
                        >
                          {content}
                        </button>
                      )
                    })}
                  </nav>
                </div>
              </li>
            </>
          )}
          {afterItems.map((item, i) => (
            <Fragment key={`a-${i}`}>
              <Separator variant={variant} />
              {renderItem(item, `a-${i}`)}
            </Fragment>
          ))}
        </>
      )}

      {resolvedCurrent && (
        <>
          {(resolvedItems.length > 0 || collapsedItems.length > 0) && (
            <Separator variant={variant} />
          )}
          <li>
            <span className="bc-current" aria-current="page">
              {resolvedCurrent}
            </span>
          </li>
        </>
      )}
    </ol>
  )

  const navBody = showBack ? (
    <div className="bc-row">
      <button type="button" className="bc-back" onClick={onBack} aria-label="Terug">
        <BackIcon />
      </button>
      {ol}
    </div>
  ) : (
    ol
  )

  if (actions) {
    return (
      <nav aria-label="Navigatie" className="breadcrumb-nav">
        <div className="breadcrumb-nav-items">{navBody}</div>
        <div className="breadcrumb-nav-actions">{actions}</div>
      </nav>
    )
  }

  return <nav aria-label="Navigatie">{navBody}</nav>
}

/**
 * Back-compat alias for the old `Breadcrumb` API.
 * Maps `items: { label, onClick }[]` to the unified component.
 */
export const Breadcrumb = Breadcrumbs
