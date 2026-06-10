import { PickProgress } from '@/components/ui/PickProgress'
import { Chip } from '@/components/ui/Chip'
import { SelectableCardGrid } from '@/components/ui/SelectableCardGrid'
import { getClass, getRace, getBackground } from '@/data/dnd5e'
import { ABILITY_SCORES, D5E_SKILLS } from '@/utils/dnd5e'
import type { WizardDraft } from '@/types/character_wizard.types'

interface Props {
  draft: WizardDraft
  patch: (updates: Partial<WizardDraft>) => void
}

export function StepSkills({ draft, patch }: Props) {
  const cls = getClass(draft.classId)
  const race = getRace(draft.raceId)
  const background = getBackground(draft.backgroundId)

  if (!cls) return null

  const pool = cls.skillPool === 'any' ? D5E_SKILLS.map((s) => s.name) : cls.skillPool
  const grantedByRace = race?.skillProficiencies ?? []
  const grantedByBackground = background?.skills ?? []
  const granted = new Set([...grantedByRace, ...grantedByBackground])

  const picks = draft.skillProficiencies
  const full = picks.length >= cls.numSkills

  const toggle = (skill: string) => {
    if (picks.includes(skill)) {
      patch({ skillProficiencies: picks.filter((s) => s !== skill) })
    } else if (!full) {
      patch({ skillProficiencies: [...picks, skill] })
    }
  }

  const groups = ABILITY_SCORES.map((ability) => ({
    ability,
    skills: D5E_SKILLS.filter((s) => s.ability === ability.key && pool.includes(s.name)),
  })).filter((g) => g.skills.length > 0)

  return (
    <div className="flex flex-col gap-5">
      <PickProgress count={picks.length} total={cls.numSkills} itemsLabel="vaardigheden">
        {picks.map((skill) => (
          <Chip key={skill} tone="teal">
            {skill}
          </Chip>
        ))}
      </PickProgress>

      {groups.map(({ ability, skills }) => (
        <div key={ability.key}>
          <p className="label mb-2">
            {ability.label} <span className="text-subtle">({ability.abbr})</span>
          </p>
          <SelectableCardGrid
            label={`Vaardigheden — ${ability.label}`}
            multiple
            compact
            value={picks}
            onSelect={toggle}
            options={skills.map((skill) => {
              const viaRace = grantedByRace.includes(skill.name)
              const viaBackground = grantedByBackground.includes(skill.name)
              return {
                id: skill.name,
                title: skill.name,
                tagline: viaRace
                  ? 'Al vaardig via je ras'
                  : viaBackground
                    ? 'Al vaardig via je achtergrond'
                    : undefined,
                // reeds-gekozen blijft altijd deselecteerbaar
                disabled: !picks.includes(skill.name) && (granted.has(skill.name) || full),
              }
            })}
          />
        </div>
      ))}
    </div>
  )
}
