import { SelectableCardGrid } from '@/components/ui/SelectableCardGrid'
import { Chip } from '@/components/ui/Chip'
import { SRD_RACES, getRace } from '@/data/dnd5e'
import { ABILITY_SCORES, formatSign } from '@/utils/dnd5e'
import { pickGradient, characterGradients } from '@/utils/pickGradient'
import type { SrdRace } from '@/types/srd5e.types'
import type { WizardDraft } from '@/types/character_wizard.types'

interface Props {
  draft: WizardDraft
  selectRace: (raceId: string | null) => void
}

/** Compacte bonusregel, bv. '+2 DEX +1 INT' of '+1 op alles'. */
function formatRaceBonuses(race: SrdRace): string {
  const entries = ABILITY_SCORES.filter((a) => (race.bonuses[a.key] ?? 0) > 0)
  const allPlusOne =
    entries.length === ABILITY_SCORES.length && entries.every((a) => race.bonuses[a.key] === 1)
  const parts = allPlusOne
    ? ['+1 op alles']
    : entries.map((a) => `${formatSign(race.bonuses[a.key]!)} ${a.abbr}`)
  if (race.flexBonusCount > 0) parts.push(`+1 ×${race.flexBonusCount} naar keuze`)
  return parts.join(' ')
}

export function StepRace({ draft, selectRace }: Props) {
  const selected = getRace(draft.raceId)

  return (
    <div>
      <SelectableCardGrid
        label="Ras"
        value={draft.raceId}
        onSelect={(id) => selectRace(id === draft.raceId ? null : id)}
        options={SRD_RACES.map((race) => ({
          id: race.id,
          title: race.name,
          tagline: race.tagline,
          meta: formatRaceBonuses(race),
          glyph: race.glyph,
          gradient: pickGradient(race.id, characterGradients),
        }))}
      />

      {selected && (
        <div className="option-detail">
          <span className="option-detail-glyph" aria-hidden="true">
            {selected.glyph}
          </span>
          <div className="min-w-0 flex-1">
            <p className="option-detail-title">{selected.name}</p>
            <p className="option-detail-text">{selected.trait}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip>{selected.speed} ft snelheid</Chip>
              {selected.darkvision > 0 && <Chip tone="violet">Duisterzicht {selected.darkvision} ft</Chip>}
              <Chip>{selected.languages.join(', ')}</Chip>
              {selected.skillProficiencies.map((skill) => (
                <Chip key={skill} tone="teal">
                  Vaardig: {skill}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
