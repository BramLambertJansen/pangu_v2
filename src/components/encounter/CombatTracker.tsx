import type { CSSProperties } from 'react'
import { cn } from '@/utils/cn'

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
    return <div className={cn('combat-tracker-empty', className)}>Geen deelnemers.</div>
  }

  return (
    <div className={className}>
      <ol className="combat-list" aria-label="Initiatiefvolgorde">
        {sorted.map((c, i) => {
          const isActive = i === activeIndex
          const hpPct = c.maxHp > 0 ? c.hp / c.maxHp : 0

          return (
            <li key={c.id} className="combatant-row" aria-current={isActive ? 'true' : undefined}>
              <div className="combatant-init" aria-label={`Initiatief ${c.initiative}`}>
                {c.initiative}
              </div>

              <div className="combatant-main">
                <p className="combatant-name">
                  {isActive && (
                    <span aria-hidden="true" className="combatant-cursor">
                      ▶
                    </span>
                  )}
                  {c.name}
                </p>
                <div
                  role="progressbar"
                  aria-valuenow={c.hp}
                  aria-valuemin={0}
                  aria-valuemax={c.maxHp}
                  aria-label={`HP: ${c.hp} van ${c.maxHp}`}
                  className="combatant-hpbar"
                >
                  <div
                    className="combatant-hpbar-fill"
                    style={{ width: `${hpPct * 100}%`, background: hpBarColor(c.hp, c.maxHp) } as CSSProperties}
                  />
                </div>
                <p className="combatant-hptext">
                  {c.hp} / {c.maxHp} HP
                </p>
              </div>

              {onHpChange && (
                <div className="combatant-steppers">
                  <button
                    type="button"
                    className="combat-hp-btn combat-hp-btn--dmg"
                    aria-label={`HP verminderen voor ${c.name}`}
                    onClick={() => onHpChange(c.id, -1)}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="combat-hp-btn combat-hp-btn--heal"
                    aria-label={`HP verhogen voor ${c.name}`}
                    onClick={() => onHpChange(c.id, +1)}
                  >
                    +
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {onNextTurn && (
        <button type="button" className="combat-next" onClick={onNextTurn}>
          Volgende beurt →
        </button>
      )}
    </div>
  )
}
