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
  primary:   'bg-[var(--violet-deep)] text-white hover:bg-[var(--violet)] focus-visible:ring-[var(--violet)]',
  secondary: 'bg-[var(--surface-2)] text-[var(--ink-soft)] hover:bg-[var(--surface-3)] focus-visible:ring-[var(--subtle)]',
  ghost:     'bg-transparent text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-soft)] focus-visible:ring-[var(--subtle)]',
  danger:    'bg-transparent text-[var(--crimson)] border border-[rgba(255,80,80,0.25)] hover:bg-[rgba(255,80,80,0.15)] focus-visible:ring-[var(--crimson)]',
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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--void)]',
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
