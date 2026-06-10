import { SelectableCardGrid } from '@/components/ui/SelectableCardGrid'
import { Chip } from '@/components/ui/Chip'
import { SRD_CLASSES, getClass } from '@/data/dnd5e'
import { ABILITY_SCORES } from '@/utils/dnd5e'
import { pickGradient, characterGradients } from '@/utils/pickGradient'
import type { CasterType } from '@/types/srd5e.types'
import type { WizardDraft } from '@/types/character_wizard.types'

interface Props {
  draft: WizardDraft
  selectClass: (classId: string | null) => void
  patch: (updates: Partial<WizardDraft>) => void
}

const CASTER_LABELS: Record<CasterType, string> = {
  none: 'Geen magie',
  full: 'Volledige caster',
  half: 'Halve caster',
  pact: 'Pact-magie',
}

export function StepClass({ draft, selectClass, patch }: Props) {
  const selected = getClass(draft.classId)
  const abbrFor = (key: string) => ABILITY_SCORES.find((a) => a.key === key)?.abbr ?? ''

  return (
    <div>
      <SelectableCardGrid
        label="Klasse"
        value={draft.classId}
        onSelect={(id) => selectClass(id === draft.classId ? null : id)}
        options={SRD_CLASSES.map((cls) => ({
          id: cls.id,
          title: cls.name,
          tagline: cls.tagline,
          meta: `${cls.hitDie} · ${abbrFor(cls.primaryAbility)} · ${CASTER_LABELS[cls.casterType]}`,
          glyph: cls.glyph,
          gradient: pickGradient(cls.id, characterGradients),
        }))}
      />

      {selected && (
        <>
          <div className="option-detail">
            <span className="option-detail-glyph" aria-hidden="true">
              {selected.glyph}
            </span>
            <div className="min-w-0 flex-1">
              <p className="option-detail-title">{selected.name}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Chip>Hit die {selected.hitDie}</Chip>
                <Chip>
                  Saves:{' '}
                  {selected.savingThrows.map((key) => abbrFor(key)).join(' & ')}
                </Chip>
                <Chip>{selected.numSkills} vaardigheden te kiezen</Chip>
                {selected.casterType !== 'none' && (
                  <Chip tone="violet">{CASTER_LABELS[selected.casterType]}</Chip>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="label mb-1">Subklasse</p>
            <p className="mb-3 mt-0 text-xs text-muted">
              Optioneel — de meeste klassen kiezen hun subklasse pas op level 2–3. Je kunt nu
              alvast een richting vastleggen.
            </p>
            <SelectableCardGrid
              label="Subklasse"
              compact
              value={draft.subclassId}
              onSelect={(id) => patch({ subclassId: id === draft.subclassId ? null : id })}
              options={selected.subclasses.map((sub) => ({
                id: sub.id,
                title: sub.name,
                tagline: sub.description,
              }))}
            />
          </div>
        </>
      )}
    </div>
  )
}
