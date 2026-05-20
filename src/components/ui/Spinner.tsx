import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

type Size = 'sm' | 'md' | 'lg'

export interface SpinnerProps extends ComponentPropsWithoutRef<'span'> {
  size?: Size
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
}

export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Laden..."
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent',
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  )
}
