import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { FormField } from './FormField'

export interface TextareaProps extends ComponentPropsWithoutRef<'textarea'> {
  label?: ReactNode
  error?: string
  hint?: string
  /** Right-aligned node in the label row (e.g. an AI-generate button). */
  labelAction?: ReactNode
  /** Extra class on the wrapping form-field. */
  fieldClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, labelAction, className, fieldClassName, id: idProp, ...props }, ref) => {
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
        <textarea
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn('textarea', error && 'input-error', className)}
          {...props}
        />
      </FormField>
    )
  },
)
Textarea.displayName = 'Textarea'
