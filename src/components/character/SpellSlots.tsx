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
export function SpellSlots({
  slots = [],
  used = [],
  onToggle,
  pending = false,
  className,
}: SpellSlotsProps) {
  const levels = slots
    .map((max, i) => ({ level: i + 1, max, usedCount: used[i] ?? 0 }))
    .filter(({ max }) => max > 0)

  if (levels.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }} className={className}>
        Geen spreukslots ingesteld.
      </p>
    )
  }

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {levels.map(({ level, max, usedCount }) => {
        const remaining = max - usedCount
        return (
          <div key={level}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: remaining > 0 ? 'var(--violet)' : 'var(--muted)',
                  minWidth: 28,
                  transition: 'color var(--t-fast)',
                }}
                aria-label={`Niveau ${level}`}
              >
                {ROMAN[level - 1]}
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'var(--font-body)' }}>
                <span style={{ fontWeight: 700, color: remaining > 0 ? 'var(--ink)' : 'var(--muted)' }}>
                  {remaining}
                </span>
                <span style={{ color: 'var(--muted)' }}>/{max}</span>
              </span>
            </div>

            <div
              role="group"
              aria-label={`Spreukslots niveau ${level}: ${remaining} van ${max} beschikbaar`}
              style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
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
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      cursor: onToggle && !pending ? 'pointer' : 'default',
                      border: isExpended
                        ? '2px solid var(--hairline-strong)'
                        : '2px solid rgb(var(--violet-rgb) / 0.5)',
                      background: isExpended
                        ? 'var(--surface)'
                        : 'rgb(var(--violet-rgb) / 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all var(--t-fast)',
                      opacity: pending ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!onToggle || pending) return
                      const el = e.currentTarget
                      el.style.borderColor = isExpended
                        ? 'rgb(var(--teal-rgb) / 0.5)'
                        : 'rgb(var(--violet-rgb) / 0.8)'
                    }}
                    onMouseLeave={(e) => {
                      if (!onToggle || pending) return
                      const el = e.currentTarget
                      el.style.borderColor = isExpended
                        ? 'var(--hairline-strong)'
                        : 'rgb(var(--violet-rgb) / 0.5)'
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        fontSize: 14,
                        color: isExpended ? 'var(--muted)' : 'var(--violet)',
                      }}
                    >
                      {isExpended ? '○' : '✦'}
                    </span>
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
