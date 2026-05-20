import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id: idProp, ...props }, ref) => {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const errorId = `${id}-error`

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-10 w-full rounded-md border px-3 text-sm transition-colors',
            'bg-[var(--surface-2)] border-[var(--hairline)] text-[var(--ink)]',
            'placeholder:text-[var(--subtle)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet)] focus-visible:border-[var(--violet)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[var(--crimson)] focus-visible:ring-[var(--crimson)]',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-xs" style={{ color: 'var(--crimson)' }}>
            {error}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
