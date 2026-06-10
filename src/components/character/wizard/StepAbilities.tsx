import { AbilityScoreEditor } from '@/components/character/AbilityScoreEditor'
import { Select } from '@/components/ui/Select'
import { getRace } from '@/data/dnd5e'
import { ABILITY_SCORES } from '@/utils/dnd5e'
import type { AbilityKey } from '@/utils/dnd5e'
import { racialBonus } from '@/utils/characterWizard'
import type { AbilityMethod, WizardDraft } from '@/types/character_wizard.types'

interface Props {
  draft: WizardDraft
  patch: (updates: Partial<WizardDraft>) => void
}

const METHOD_RESET: Record<AbilityMethod, Partial<WizardDraft>> = {
  pointbuy: {
    scores: { stat_str: 8, stat_dex: 8, stat_con: 8, stat_int: 8, stat_wis: 8, stat_cha: 8 },
  },
  array: { arrayAssigned: {} },
  manual: {
    scores: { stat_str: 10, stat_dex: 10, stat_con: 10, stat_int: 10, stat_wis: 10, stat_cha: 10 },
  },
}

export function StepAbilities({ draft, patch }: Props) {
  const race = getRace(draft.raceId)

  const bonuses = {} as Record<AbilityKey, number>
  for (const ability of ABILITY_SCORES) bonuses[ability.key] = racialBonus(draft, ability.key)

  const setFlexPick = (slot: number, key: string) => {
    const next = [...draft.flexBonusPicks]
    if (key) next[slot] = key as AbilityKey
    else next.splice(slot, 1)
    patch({ flexBonusPicks: next.filter(Boolean) })
  }

  // vrije +1's mogen niet op een eigenschap met vaste rasbonus of dubbel vallen
  const flexOptions = (slot: number) =>
    ABILITY_SCORES.filter(
      (a) =>
        (race?.bonuses[a.key] ?? 0) === 0 &&
        !draft.flexBonusPicks.some((picked, i) => picked === a.key && i !== slot),
    ).map((a) => ({ value: a.key, label: a.label }))

  return (
    <div className="flex flex-col gap-5">
      {race && race.flexBonusCount > 0 && (
        <div className="surface p-4">
          <p className="label mb-1">Vrije rasbonussen ({race.name})</p>
          <p className="mb-3 mt-0 text-xs text-muted">
            Kies {race.flexBonusCount} verschillende eigenschappen die elk +1 krijgen.
          </p>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: race.flexBonusCount }, (_, slot) => (
              <Select
                key={slot}
                label={`Vrije +1 — keuze ${slot + 1}`}
                value={draft.flexBonusPicks[slot] ?? ''}
                onChange={(e) => setFlexPick(slot, e.target.value)}
                options={[{ value: '', label: 'Kies eigenschap...' }, ...flexOptions(slot)]}
                fieldClassName="min-w-44"
              />
            ))}
          </div>
        </div>
      )}

      <AbilityScoreEditor
        method={draft.abilityMethod}
        onMethodChange={(method) => patch({ abilityMethod: method, ...METHOD_RESET[method] })}
        scores={draft.scores}
        onScoresChange={(scores) => patch({ scores })}
        arrayAssigned={draft.arrayAssigned}
        onArrayAssignedChange={(arrayAssigned) => patch({ arrayAssigned })}
        bonuses={bonuses}
      />
    </div>
  )
}
