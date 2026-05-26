import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  /** Optional actions rendered on the right side (e.g. an edit link) */
  actions?: React.ReactNode
}

const BackArrow = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
  </svg>
)

export function Breadcrumb({ items, actions }: BreadcrumbProps) {
  const firstClickableIndex = items.findIndex((item) => item.onClick !== undefined)
  const itemsRef = useRef<HTMLDivElement>(null)
  const fullWidthRef = useRef<number | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const check = useCallback(() => {
    const el = itemsRef.current
    if (!el) return

    setCollapsed((current) => {
      if (!current) {
        if (el.scrollWidth > el.clientWidth + 1) {
          fullWidthRef.current = el.scrollWidth
          return true
        }
        return false
      } else {
        if (fullWidthRef.current !== null && el.clientWidth >= fullWidthRef.current) {
          return false
        }
        return true
      }
    })
  }, [])

  // Reset on items change so a fresh measurement is taken
  useLayoutEffect(() => {
    fullWidthRef.current = null
    setCollapsed(false)
  }, [items])

  // Measure after every render (catches items changes + initial mount)
  useLayoutEffect(() => {
    check()
  })

  // Re-check whenever the container is resized
  useEffect(() => {
    const el = itemsRef.current
    if (!el) return
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [check])

  const first = items[0]
  const last = items[items.length - 1]
  // Number of levels collapsed: show one "../" per hidden item
  const hiddenCount = items.length - 2
  const ellipsisLabel = '../'.repeat(Math.max(hiddenCount, 1))

  const renderFull = () =>
    items.map((item, i) => (
      <Fragment key={i}>
        {i > 0 && <span aria-hidden="true" className="pangu-breadcrumb-sep">·</span>}
        {item.onClick ? (
          <button
            type="button"
            onClick={item.onClick}
            aria-label={i === firstClickableIndex ? `Terug naar ${item.label}` : `Ga naar ${item.label}`}
            className="pangu-breadcrumb-btn"
          >
            {i === firstClickableIndex && <BackArrow />}
            {item.label}
          </button>
        ) : (
          <span className="pangu-breadcrumb-current" aria-current="page">
            {item.label}
          </span>
        )}
      </Fragment>
    ))

  const renderCollapsed = () => (
    <>
      {first?.onClick ? (
        <button
          type="button"
          onClick={first.onClick}
          aria-label={`Terug naar ${first.label}`}
          className="pangu-breadcrumb-btn"
        >
          <BackArrow />
          {first.label}
        </button>
      ) : (
        <span className="pangu-breadcrumb-current">{first?.label}</span>
      )}
      {items.length > 2 && (
        <>
          <span aria-hidden="true" className="pangu-breadcrumb-sep">·</span>
          <span className="pangu-breadcrumb-ellipsis" aria-label="tussenliggende niveaus">
            {ellipsisLabel}
          </span>
        </>
      )}
      {items.length > 1 && (
        <>
          <span aria-hidden="true" className="pangu-breadcrumb-sep">·</span>
          {last.onClick ? (
            <button
              type="button"
              onClick={last.onClick}
              aria-label={`Ga naar ${last.label}`}
              className="pangu-breadcrumb-btn"
            >
              {last.label}
            </button>
          ) : (
            <span className="pangu-breadcrumb-current" aria-current="page">
              {last.label}
            </span>
          )}
        </>
      )}
    </>
  )

  return (
    <nav aria-label="Navigatie" className="pangu-breadcrumb">
      <div ref={itemsRef} className="pangu-breadcrumb-items">
        {collapsed ? renderCollapsed() : renderFull()}
      </div>
      {actions && <div className="pangu-breadcrumb-actions">{actions}</div>}
    </nav>
  )
}
