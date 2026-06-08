import { cn } from '@/utils/cn'

export interface OrnateDividerProps {
  /** Optional centered pill label flanked by gradient rules. */
  label?: string
  className?: string
}

/** Section divider that fades to transparent at the ends, with an optional ❋ label. */
export function OrnateDivider({ label, className }: OrnateDividerProps) {
  return (
    <div className={cn('div-ornate', className)} role="separator" aria-label={label}>
      {label && <span className="glyph">❋ {label} ❋</span>}
    </div>
  )
}
