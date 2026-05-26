import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label?: string
  error?: string
  /** Element rendered inside the input wrapper, flush to the right edge. Use for icon buttons (e.g. password toggle). */
  suffix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, suffix, className, id: idProp, ...props }, ref) => {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const errorId = `${id}-error`

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-ink-soft">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            className={cn(
              'h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 text-sm text-ink',
              'placeholder:text-muted',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-crimson focus-visible:ring-crimson',
              suffix && 'pr-10',
              className,
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-crimson">
            {error}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
