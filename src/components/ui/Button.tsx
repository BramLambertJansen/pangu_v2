import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: Variant
  size?: Size
  /** Shows a spinner and disables the button while true */
  loading?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500',
  secondary: 'bg-gray-700 text-gray-100 hover:bg-gray-600 focus-visible:ring-gray-500',
  ghost:     'bg-transparent text-gray-300 hover:bg-gray-800 focus-visible:ring-gray-500',
  danger:    'bg-red-700 text-white hover:bg-red-600 focus-visible:ring-red-500',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 min-w-[44px] px-3 text-xs',
  md: 'h-10 min-w-[44px] px-4 text-sm',
  lg: 'h-12 min-w-[44px] px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner size="sm" aria-hidden="true" />}
      {children}
    </button>
  )
}
