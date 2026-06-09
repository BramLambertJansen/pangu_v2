import { useId } from 'react'
import { cn } from '@/utils/cn'

export type ToggleVariant = 'accent' | 'gold'
export type ToggleSize = 'sm' | 'md'

export interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  /** When provided, renders the bundled label + description row layout. */
  label?: string
  description?: string
  variant?: ToggleVariant
  size?: ToggleSize
  disabled?: boolean
  /** Accessible name for the bare switch (only when no label is given). */
  'aria-label'?: string
  className?: string
}

/**
 * Canonical PANGU toggle — `<button role="switch">` with a sliding thumb.
 *
 * - With `label`: renders the bundled `.toggle-row` (label + description + switch).
 * - Without `label`: renders just the switch; pass `aria-label` for a11y.
 */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  variant = 'accent',
  size = 'md',
  disabled = false,
  'aria-label': ariaLabel,
  className,
}: ToggleProps) {
  const labelId = useId()

  const switchEl = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={label ? labelId : undefined}
      aria-label={!label ? ariaLabel : undefined}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'toggle',
        variant === 'gold' && 'toggle-gold',
        size === 'sm' && 'toggle-sm',
        !label && className,
      )}
    >
      <span className="toggle-thumb" />
    </button>
  )

  if (!label) return switchEl

  return (
    <div className={cn('toggle-row', className)}>
      <div className="toggle-row-info">
        <p id={labelId} className="toggle-row-label">{label}</p>
        {description && <p className="toggle-row-desc">{description}</p>}
      </div>
      {switchEl}
    </div>
  )
}

