export interface Combatant {
  id: string
  name: string
  initiative: number
  hp: number
  maxHp: number
}

export interface CombatTrackerProps {
  encounterId: string
  combatants?: Combatant[]
  /** Index of the combatant whose turn it currently is. */
  activeIndex?: number
  onNextTurn?: () => void
  onHpChange?: (id: string, delta: number) => void
  className?: string
}

function hpBarColor(current: number, max: number): string {
  if (max === 0) return 'var(--muted)'
  const pct = current / max
  if (pct > 0.5) return 'var(--teal)'
  if (pct > 0.25) return 'var(--gold)'
  return 'var(--crimson)'
}

/** Embeddable initiative-order widget: sorted list, active-turn highlight, HP steppers. */
export function CombatTracker({
  combatants = [],
  activeIndex = 0,
  onNextTurn,
  onHpChange,
  className,
}: CombatTrackerProps) {
  const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative)

  if (sorted.length === 0) {
    return (
      <div
        className={className}
        style={{
          padding: '24px 20px',
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: 13,
          fontStyle: 'italic',
        }}
      >
        Geen deelnemers.
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Combatant list */}
      <ol
        style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}
        aria-label="Initiatiefvolgorde"
      >
        {sorted.map((c, i) => {
          const isActive = i === activeIndex
          const hpPct = c.maxHp > 0 ? c.hp / c.maxHp : 0
          const barColor = hpBarColor(c.hp, c.maxHp)

          return (
            <li
              key={c.id}
              aria-current={isActive ? 'true' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                border: isActive
                  ? '1px solid rgb(var(--violet-rgb) / 0.55)'
                  : '1px solid var(--hairline)',
                background: isActive
                  ? 'linear-gradient(135deg, rgb(var(--violet-rgb) / 0.12) 0%, rgb(var(--violet-rgb) / 0.04) 100%)'
                  : 'var(--surface)',
                boxShadow: isActive ? '0 0 18px rgb(var(--violet-rgb) / 0.18)' : 'none',
                transition: 'all var(--t-base)',
              }}
            >
              {/* Initiative badge */}
              <div
                aria-label={`Initiatief ${c.initiative}`}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: isActive
                    ? '2px solid rgb(var(--violet-rgb) / 0.6)'
                    : '1px solid var(--hairline-strong)',
                  background: isActive
                    ? 'rgb(var(--violet-rgb) / 0.15)'
                    : 'var(--surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: isActive ? 'var(--violet)' : 'var(--ink-soft)',
                  }}
                >
                  {c.initiative}
                </span>
              </div>

              {/* Name + HP bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: '0 0 6px',
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isActive && (
                    <span aria-hidden="true" style={{ color: 'var(--violet)', marginRight: 6, fontSize: 10 }}>▶</span>
                  )}
                  {c.name}
                </p>
                <div
                  role="progressbar"
                  aria-valuenow={c.hp}
                  aria-valuemin={0}
                  aria-valuemax={c.maxHp}
                  aria-label={`HP: ${c.hp} van ${c.maxHp}`}
                  style={{ height: 4, borderRadius: 2, background: 'var(--hairline)', overflow: 'hidden' }}
                >
                  <div
                    style={{
                      width: `${hpPct * 100}%`,
                      height: '100%',
                      borderRadius: 2,
                      background: barColor,
                      transition: 'width 0.3s var(--ease-out), background 0.3s',
                    }}
                  />
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--muted)' }}>
                  {c.hp} / {c.maxHp} HP
                </p>
              </div>

              {/* HP steppers */}
              {onHpChange && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button
                    type="button"
                    aria-label={`HP verminderen voor ${c.name}`}
                    onClick={() => onHpChange(c.id, -1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: '1px solid var(--hairline-strong)',
                      background: 'var(--surface-2)',
                      color: 'var(--crimson)',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background var(--t-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgb(var(--crimson-rgb) / 0.12)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    aria-label={`HP verhogen voor ${c.name}`}
                    onClick={() => onHpChange(c.id, +1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: '1px solid var(--hairline-strong)',
                      background: 'var(--surface-2)',
                      color: 'var(--teal)',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background var(--t-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgb(var(--teal-rgb) / 0.12)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  >
                    +
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {/* Next turn button */}
      {onNextTurn && (
        <button
          type="button"
          onClick={onNextTurn}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid rgb(var(--violet-rgb) / 0.35)',
            background: 'rgb(var(--violet-rgb) / 0.08)',
            color: 'var(--violet)',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all var(--t-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgb(var(--violet-rgb) / 0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgb(var(--violet-rgb) / 0.08)'
          }}
        >
          Volgende beurt →
        </button>
      )}
    </div>
  )
}
