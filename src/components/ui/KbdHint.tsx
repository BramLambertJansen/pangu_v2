import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

export type KbdHintProps = ComponentPropsWithoutRef<'kbd'>

/** Monospace keyboard-key hint (e.g. the `/` shortcut chip in the search bar). */
export function KbdHint({ className, children, ...props }: KbdHintProps) {
  return (
    <kbd
      className={cn(
        'inline-flex h-[22px] min-w-[22px] items-center justify-center rounded border border-hairline bg-surface px-1 font-mono text-[11px] font-semibold text-subtle',
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}
