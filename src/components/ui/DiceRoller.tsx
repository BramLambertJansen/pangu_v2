import { useState } from 'react'
import { cn } from '@/utils/cn'

const DICE = [4, 6, 8, 10, 12, 20, 100] as const
type Die = (typeof DICE)[number]

interface Roll {
  id: number
  die: Die
  value: number
}

export interface DiceRollerProps {
  className?: string
  /** Called after every roll with the rolled value and die size. */
  onRoll?: (value: number, die: Die) => void
}

/** Inline polyhedral dice roller with a short roll history (last 5). */
export function DiceRoller({ className, onRoll }: DiceRollerProps) {
  const [history, setHistory] = useState<Roll[]>([])
  const last = history[0]

  const roll = (die: Die) => {
    const value = 1 + Math.floor(Math.random() * die)
    setHistory((h) => [{ id: Date.now(), die, value }, ...h].slice(0, 5))
    onRoll?.(value, die)
  }

  return (
    <div className={cn('surface flex flex-col gap-4 p-5', className)}>
      <div className="flex flex-wrap gap-2">
        {DICE.map((die) => (
          <button key={die} type="button" className="btn btn-violet-soft btn-sm" onClick={() => roll(die)}>
            d{die}
          </button>
        ))}
      </div>
      <div
        className="surface-void flex min-h-[64px] items-center justify-center text-center"
        role="status"
        aria-live="polite"
      >
        {last ? (
          <span className="pg-mono text-3xl font-bold text-violet">
            {last.value}
            <span className="ml-2 text-sm text-muted">/ d{last.die}</span>
          </span>
        ) : (
          <span className="pg-quote">Werp de dobbelsteen…</span>
        )}
      </div>
      {history.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {history.slice(1).map((r) => (
            <span key={r.id} className="chip pg-mono">
              {r.value} <span className="text-muted">d{r.die}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
