import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

export type KbdHintProps = ComponentPropsWithoutRef<'kbd'>

/** Monospace keyboard-key hint (e.g. the `/` shortcut chip in the search bar). */
export function KbdHint({ className, children, ...props }: KbdHintProps) {
  return (
    <kbd className={cn('kbd', className)} {...props}>
      {children}
    </kbd>
  )
}
