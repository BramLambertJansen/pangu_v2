import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

type Size = 'sm' | 'md' | 'lg'

export interface SpinnerProps extends ComponentPropsWithoutRef<'span'> {
  size?: Size
}

const sizeClass: Record<Size, string> = {
  sm: 'spinner-sm',
  md: 'spinner-md',
  lg: 'spinner-lg',
}

export function Spinner({ size = 'md', className, 'aria-label': ariaLabel = 'Laden...', ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={cn('spinner', sizeClass[size], className)}
      {...props}
    />
  )
}
