import { Fragment } from 'react'

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

  return (
    <nav aria-label="Navigatie" className="pangu-breadcrumb">
      <div className="pangu-breadcrumb-items">
        {items.map((item, i) => (
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
        ))}
      </div>
      {actions && <div>{actions}</div>}
    </nav>
  )
}
