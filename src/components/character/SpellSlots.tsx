import { cn } from '@/utils/cn'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const

export interface SpellSlotsProps {
  /** Total slots per spell level (index 0 = level 1, length 9). */
  slots?: number[]
  /** Expended (used) slots per spell level (index 0 = level 1). */
  used?: number[]
  onToggle?: (level: number, pipIndex: number) => void
  /** Show loading state on pips */
  pending?: boolean
  className?: string
}

/** Interactive spell-slot tracker with pip buttons and Roman-numeral levels. */
export function SpellSlots({ slots = [], used = [], onToggle, pending = false, className }: SpellSlotsProps) {
  const levels = slots
    .map((max, i) => ({ level: i + 1, max, usedCount: used[i] ?? 0 }))
    .filter(({ max }) => max > 0)

  if (levels.length === 0) {
    return <p className={cn('spell-slots-empty', className)}>Geen spreukslots ingesteld.</p>
  }

  return (
    <div className={cn('spell-slots', className)}>
      {levels.map(({ level, max, usedCount }) => {
        const remaining = max - usedCount
        const available = remaining > 0
        return (
          <div key={level}>
            <div className="spell-slot-head">
              <span className="spell-slot-roman" data-available={available} aria-label={`Niveau ${level}`}>
                {ROMAN[level - 1]}
              </span>
              <span className="spell-slot-count" data-available={available}>
                <b>{remaining}</b>
                <span>/{max}</span>
              </span>
            </div>

            <div
              role="group"
              aria-label={`Spreukslots niveau ${level}: ${remaining} van ${max} beschikbaar`}
              className="spell-slot-pips"
            >
              {Array.from({ length: max }, (_, i) => {
                const isExpended = i < usedCount
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={
                      isExpended
                        ? `Spreukslot ${i + 1} niveau ${level} herstellen`
                        : `Spreukslot ${i + 1} niveau ${level} gebruiken`
                    }
                    aria-pressed={isExpended}
                    onClick={() => onToggle?.(level, i)}
                    disabled={pending || !onToggle}
                    className={cn('spell-slot-pip', isExpended && 'spell-slot-pip--expended')}
                  >
                    <span aria-hidden="true">{isExpended ? '○' : '✦'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
