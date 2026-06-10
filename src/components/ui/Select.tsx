import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { FormField } from './FormField'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends ComponentPropsWithoutRef<'select'> {
  label?: ReactNode
  error?: string
  hint?: string
  labelAction?: ReactNode
  /** Convenience: render options from data instead of passing <option> children. */
  options?: SelectOption[]
  /** Extra class on the wrapping form-field. */
  fieldClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, hint, labelAction, options, children, className, fieldClassName, id: idProp, ...props },
    ref,
  ) => {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

    return (
      <FormField
        label={label}
        htmlFor={id}
        error={error}
        hint={hint}
        labelAction={labelAction}
        className={fieldClassName}
      >
        <select
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn('select-trigger', error && 'input-error', className)}
          {...props}
        >
          {options
            ? options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))
            : children}
        </select>
      </FormField>
    )
  },
)
Select.displayName = 'Select'
