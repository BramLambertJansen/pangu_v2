import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

export interface SearchBarProps extends Omit<ComponentPropsWithoutRef<'input'>, 'onChange'> {
  value: string
  onValueChange: (value: string) => void
  /** Renders the tighter inline variant used inside toolbars and pickers. */
  compact?: boolean
  /** Accessible label for the search field (visually hidden). */
  label?: string
}

/**
 * Canonical search field with leading glyph and a clear button. Styling lives
 * entirely in the `.search-bar*` token-driven classes so themes re-skin it.
 */
export function SearchBar({
  value,
  onValueChange,
  compact = false,
  label = 'Zoeken',
  className,
  placeholder = 'Zoeken…',
  id,
  ...props
}: SearchBarProps) {
  return (
    <div className={cn('search-bar', compact && 'is-compact', className)}>
      <span className="search-bar-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        id={id}
        type="search"
        className="search-bar-input"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        {...props}
      />
      {value && (
        <button
          type="button"
          className="search-bar-clear"
          aria-label="Zoekopdracht wissen"
          onClick={() => onValueChange('')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}
