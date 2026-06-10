import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface FormFieldProps {
  /** Visible label text. Omit for a control-only field. */
  label?: ReactNode
  /** id of the control this field labels (sets <label htmlFor>). */
  htmlFor?: string
  /** Error message; the wrapped control should also render its error state. */
  error?: string
  /** Helper text shown only when there is no error. */
  hint?: string
  /** Right-aligned node in the label row (e.g. an AI-generate IconButton). */
  labelAction?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * Canonical field chrome: label row (+ optional action), control slot, then
 * error/hint. Used directly for arbitrary controls (toggle groups, custom
 * widgets) and internally by Input/Select/Textarea so all fields share one
 * structure. Error/hint ids derive from `htmlFor` so controls can wire
 * `aria-describedby` without extra plumbing.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  labelAction,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('form-field', className)}>
      {(label || labelAction) && (
        <div className="form-field-head">
          {label ? (
            <label className="label" htmlFor={htmlFor}>
              {label}
            </label>
          ) : (
            <span />
          )}
          {labelAction}
        </div>
      )}
      {children}
      {error && (
        <p className="field-error" role="alert" id={htmlFor ? `${htmlFor}-error` : undefined}>
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="field-hint" id={htmlFor ? `${htmlFor}-hint` : undefined}>
          {hint}
        </p>
      )}
    </div>
  )
}
