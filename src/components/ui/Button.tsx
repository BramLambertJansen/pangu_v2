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
  primary:   'bg-violet text-void hover:bg-violet-soft focus-visible:ring-violet',
  secondary: 'bg-surface-2 text-ink hover:bg-surface-3 focus-visible:ring-violet',
  ghost:     'bg-transparent text-ink-soft hover:bg-surface-hover focus-visible:ring-violet',
  danger:    'bg-crimson/20 text-crimson border border-crimson/30 hover:bg-crimson/30 focus-visible:ring-crimson',
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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-void',
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
