import { cn } from '@/utils/cn'

export type OrnateDividerTone = 'gold' | 'violet' | 'muted'

export interface OrnateDividerProps {
  /** Optional centered pill label flanked by gradient rules. */
  label?: string
  /** Glyph rendered before and after the label. Defaults to ❋. */
  glyph?: string
  /** Color tone for the label pill text + glyph. */
  tone?: OrnateDividerTone
  /** Tighter vertical margin for nested or dense sections. */
  compact?: boolean
  className?: string
}

/** Section divider that fades to transparent at the ends, with an optional glyph label. */
export function OrnateDivider({
  label,
  glyph = '❋',
  tone = 'gold',
  compact = false,
  className,
}: OrnateDividerProps) {
  const classes = cn(
    'div-ornate',
    compact && 'div-ornate-compact',
    tone === 'violet' && 'div-ornate-violet',
    tone === 'muted' && 'div-ornate-muted',
    className,
  )
  return (
    <div className={classes} role="separator" aria-label={label}>
      {label && (
        <span className="glyph">
          {glyph} {label} {glyph}
        </span>
      )}
    </div>
  )
}
