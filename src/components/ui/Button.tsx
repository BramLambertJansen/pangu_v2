import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: Variant
  size?: Size
  /** Shows a spinner and disables the button while true */
  loading?: boolean
}

// Maps to the canonical token-driven .btn layer in index.css so every button
// shares one theme-switchable look.
const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-crimson',
  gold: 'btn-gold',
}

const sizeClass: Record<Size, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
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
      className={cn('btn', variantClass[variant], sizeClass[size], className)}
      {...props}
    >
      {loading && <Spinner size="sm" aria-hidden="true" />}
      {children}
    </button>
  )
}
