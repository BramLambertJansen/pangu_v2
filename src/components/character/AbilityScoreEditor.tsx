import { useState } from 'react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { NumberStepper } from '@/components/ui/NumberStepper'
import { ABILITY_SCORES, formatModifier, formatSign } from '@/utils/dnd5e'
import type { AbilityKey } from '@/utils/dnd5e'
import {
  POINT_BUY_BUDGET,
  POINT_BUY_COSTS,
  POINT_BUY_MIN,
  POINT_BUY_MAX,
  STANDARD_ARRAY,
  MANUAL_MIN,
  MANUAL_MAX,
} from '@/data/dnd5e'
import { pointBuySpent } from '@/utils/characterWizard'
import type { AbilityMethod } from '@/types/character_wizard.types'

export interface AbilityScoreEditorProps {
  method: AbilityMethod
  onMethodChange: (method: AbilityMethod) => void
  /** Basisscores voor pointbuy/manual. */
  scores: Record<AbilityKey, number>
  onScoresChange: (scores: Record<AbilityKey, number>) => void
  /** Standard array-toewijzing. */
  arrayAssigned: Partial<Record<AbilityKey, number>>
  onArrayAssignedChange: (assigned: Partial<Record<AbilityKey, number>>) => void
  /** Rasbonus per eigenschap (incl. vrije +1's), getoond als aparte kolom. */
  bonuses: Record<AbilityKey, number>
}

const METHOD_OPTIONS: { value: AbilityMethod; label: string }[] = [
  { value: 'pointbuy', label: 'Point Buy' },
  { value: 'array', label: 'Standard Array' },
  { value: 'manual', label: 'Handmatig' },
]

/**
 * De drie SRD-invoermethodes voor ability scores achter één component.
 * Rasbonussen worden alleen getoond; optellen gebeurt bij de aanroeper.
 */
export function AbilityScoreEditor({
  method,
  onMethodChange,
  scores,
  onScoresChange,
  arrayAssigned,
  onArrayAssignedChange,
  bonuses,
}: AbilityScoreEditorProps) {
  const [heldValue, setHeldValue] = useState<number | null>(null)

  const remaining = POINT_BUY_BUDGET - pointBuySpent(scores)

  const pointBuyMax = (key: AbilityKey): number => {
    const current = scores[key]
    if (current >= POINT_BUY_MAX) return POINT_BUY_MAX
    const stepCost = POINT_BUY_COSTS[current + 1] - POINT_BUY_COSTS[current]
    return stepCost <= remaining ? POINT_BUY_MAX : current
  }

  const usedValues = Object.values(arrayAssigned).filter((v): v is number => v !== undefined)

  const handleChipClick = (value: number) => {
    setHeldValue(heldValue === value ? null : value)
  }

  const handleSlotClick = (key: AbilityKey) => {
    if (heldValue !== null) {
      const next = { ...arrayAssigned }
      for (const k of Object.keys(next) as AbilityKey[]) {
        if (next[k] === heldValue) delete next[k]
      }
      next[key] = heldValue
      onArrayAssignedChange(next)
      setHeldValue(null)
    } else if (arrayAssigned[key] !== undefined) {
      const next = { ...arrayAssigned }
      const freed = next[key]!
      delete next[key]
      onArrayAssignedChange(next)
      setHeldValue(freed)
    }
  }

  const baseFor = (key: AbilityKey): number | null =>
    method === 'array' ? (arrayAssigned[key] ?? null) : scores[key]

  return (
    <div className="ability-editor">
      <div className="flex flex-wrap items-center gap-4">
        <SegmentedControl
          label="Invoermethode"
          value={method}
          options={METHOD_OPTIONS}
          onChange={onMethodChange}
        />
        {method === 'pointbuy' && (
          <span className="pick-progress-text" data-complete={remaining === 0} role="status">
            {remaining} {remaining === 1 ? 'punt' : 'punten'} over
          </span>
        )}
      </div>

      {method === 'array' && (
        <div className="array-pool" role="group" aria-label="Beschikbare waarden">
          {STANDARD_ARRAY.map((value) => {
            const used = usedValues.includes(value)
            return (
              <button
                key={value}
                type="button"
                className="array-chip"
                data-held={heldValue === value}
                disabled={used}
                aria-pressed={heldValue === value}
                aria-label={`Waarde ${value}${used ? ' (toegewezen)' : ''}`}
                onClick={() => handleChipClick(value)}
              >
                {value}
              </button>
            )
          })}
          <span className="wizard-nav-hint self-center" role="status">
            {heldValue !== null
              ? `Klik op een eigenschap om ${heldValue} toe te wijzen`
              : 'Kies een waarde en wijs die toe aan een eigenschap'}
          </span>
        </div>
      )}

      {ABILITY_SCORES.map((ability) => {
        const base = baseFor(ability.key)
        const bonus = bonuses[ability.key] ?? 0
        const total = base === null ? null : base + bonus
        return (
          <div key={ability.key} className="ability-row">
            <span className="ability-row-name">
              <span className="ability-row-abbr">{ability.abbr}</span>
              <span className="ability-row-label">{ability.label}</span>
            </span>

            <span className="ability-row-controls">
              {method === 'pointbuy' && (
                <NumberStepper
                  label={ability.label}
                  value={scores[ability.key]}
                  min={POINT_BUY_MIN}
                  max={pointBuyMax(ability.key)}
                  onChange={(next) => onScoresChange({ ...scores, [ability.key]: next })}
                />
              )}
              {method === 'array' && (
                <button
                  type="button"
                  className="array-slot"
                  data-assigned={arrayAssigned[ability.key] !== undefined}
                  aria-label={
                    arrayAssigned[ability.key] !== undefined
                      ? `${ability.label}: ${arrayAssigned[ability.key]} (klik om los te maken)`
                      : `${ability.label}: waarde toewijzen`
                  }
                  onClick={() => handleSlotClick(ability.key)}
                >
                  {arrayAssigned[ability.key] ?? '—'}
                </button>
              )}
              {method === 'manual' && (
                <input
                  type="number"
                  className="ability-input"
                  min={MANUAL_MIN}
                  max={MANUAL_MAX}
                  value={scores[ability.key]}
                  aria-label={ability.label}
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10)
                    const clamped = Number.isNaN(parsed)
                      ? MANUAL_MIN
                      : Math.min(MANUAL_MAX, Math.max(MANUAL_MIN, parsed))
                    onScoresChange({ ...scores, [ability.key]: clamped })
                  }}
                />
              )}
            </span>

            <span className="ability-row-bonus" aria-label={`Rasbonus ${formatSign(bonus)}`}>
              {bonus > 0 ? formatSign(bonus) : '—'}
            </span>

            <span className="ability-row-total">
              <span className="total">{total ?? '—'}</span>
              <span className="mod">{total === null ? '' : formatModifier(total)}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
