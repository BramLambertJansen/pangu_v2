import { cn } from '@/utils/cn'

export interface CheckboxProps {
  checked: boolean
  /** Tri-state indeterminate display (still toggles to true on click). */
  indeterminate?: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
  'aria-label'?: string
  className?: string
}

const CheckGlyph = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <polyline points="5 12 10 17 19 8" />
  </svg>
)

const DashGlyph = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <line x1="6" y1="12" x2="18" y2="12" />
  </svg>
)

/** Canonical PANGU checkbox — `<button role="checkbox">` with a glyph. */
export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  disabled = false,
  'aria-label': ariaLabel,
  className,
}: CheckboxProps) {
  const ariaChecked: boolean | 'mixed' = indeterminate ? 'mixed' : checked

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={ariaChecked}
      aria-label={!label ? ariaLabel : undefined}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn('check-row', className)}
    >
      <span className="check-box">
        {indeterminate ? <DashGlyph /> : checked ? <CheckGlyph /> : null}
      </span>
      {label && <span className="check-label">{label}</span>}
    </button>
  )
}
