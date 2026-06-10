import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  /** Required accessible name — these buttons are icon-only. */
  'aria-label': string
  /** Smaller 36px variant; default is the 48px touch target. */
  size?: 'sm' | 'md'
  children: ReactNode
}

/** Icon-only button on the canonical `.btn-icon` class (48px touch target). */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, type = 'button', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn('btn-icon', size === 'sm' && 'btn-icon-sm', className)}
      {...props}
    >
      {children}
    </button>
  ),
)
IconButton.displayName = 'IconButton'
