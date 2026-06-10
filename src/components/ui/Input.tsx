import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { FormField } from './FormField'

export interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label?: ReactNode
  error?: string
  hint?: string
  /** Right-aligned node in the label row (e.g. an AI-generate button). */
  labelAction?: ReactNode
  /** Element rendered flush to the input's right edge (e.g. password toggle). */
  suffix?: ReactNode
  /** Extra class on the wrapping form-field. */
  fieldClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, labelAction, suffix, className, fieldClassName, id: idProp, ...props }, ref) => {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

    const control = (
      <input
        ref={ref}
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={cn('input', error && 'input-error', className)}
        {...props}
      />
    )

    return (
      <FormField
        label={label}
        htmlFor={id}
        error={error}
        hint={hint}
        labelAction={labelAction}
        className={fieldClassName}
      >
        {suffix ? (
          <div className="input-suffix-wrap">
            {control}
            <div className="input-suffix">{suffix}</div>
          </div>
        ) : (
          control
        )}
      </FormField>
    )
  },
)
Input.displayName = 'Input'
