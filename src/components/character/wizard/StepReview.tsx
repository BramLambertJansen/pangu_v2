import type { ReactNode } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { ABILITY_SCORES, formatModifier, formatSign } from '@/utils/dnd5e'
import { deriveLevel1Stats, finalScores, isCasterAtLevel1 } from '@/utils/characterWizard'
import { getRace, getClass, getBackground } from '@/data/dnd5e'
import { useSpells } from '@/hooks/queries/useSpells'
import { useUserCampaignNames } from '@/hooks/queries/useCampaign'
import { useAuthStore } from '@/stores/auth.store'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'
import { WIZARD_STEPS } from '@/utils/characterWizard'
import type { WizardStepId } from '@/types/character_wizard.types'
import type { WizardDraft } from '@/types/character_wizard.types'

interface Props {
  draft: WizardDraft
  goToStep: (index: number) => void
}

function Section({
  title,
  stepId,
  goToStep,
  children,
}: {
  title: string
  stepId: WizardStepId
  goToStep: (index: number) => void
  children: ReactNode
}) {
  const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === stepId)
  return (
    <section className="surface p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="pg-section-title m-0">{title}</h3>
        <Button variant="ghost" size="sm" onClick={() => goToStep(stepIndex)}>
          Wijzig
        </Button>
      </div>
      {children}
    </section>
  )
}

export function StepReview({ draft, goToStep }: Props) {
  const user = useAuthStore((s) => s.user)
  const race = getRace(draft.raceId)
  const cls = getClass(draft.classId)
  const background = getBackground(draft.backgroundId)
  const subclass = cls?.subclasses.find((s) => s.id === draft.subclassId)
  const scores = finalScores(draft)
  const derived = deriveLevel1Stats(draft)
  const { data: spells } = useSpells()
  const { data: campaigns } = useUserCampaignNames(user?.id)
  const campaignName = campaigns?.find((c) => c.id === draft.campaignId)?.name

  const spellName = (id: string) => spells?.find((s) => s.id === id)?.name ?? '…'
  const traits = [
    { label: 'Persoonlijkheid', value: draft.personality },
    { label: 'Ideaal', value: draft.ideal },
    { label: 'Band', value: draft.bond },
    { label: 'Gebrek', value: draft.flaw },
  ].filter((t) => t.value.trim())

  return (
    <div className="flex flex-col gap-4">
      <Section title="Basis" stepId="basis" goToStep={goToStep}>
        <div className="flex items-center gap-4">
          <Avatar
            size="lg"
            src={sanitizeImageUrl(draft.portraitUrl)}
            alt={draft.name}
            fallback={cls?.glyph ?? '✦'}
          />
          <div className="min-w-0">
            <p className="m-0 text-base font-semibold text-ink">{draft.name}</p>
            {draft.subtitle.trim() && <p className="m-0 text-sm text-muted">{draft.subtitle}</p>}
            <p className="m-0 mt-1 text-xs text-muted">
              {campaignName ? `Kroniek: ${campaignName}` : 'Niet aan een kroniek gekoppeld'}
            </p>
          </div>
        </div>
      </Section>

      <Section title="Ras & klasse" stepId="ras" goToStep={goToStep}>
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="violet">{race?.name ?? '—'}</Chip>
          <Chip tone="violet">{cls?.name ?? '—'}</Chip>
          {subclass && <Chip>{subclass.name}</Chip>}
          {background && <Chip tone="teal">{background.name}</Chip>}
          {draft.alignment && <Chip>{draft.alignment}</Chip>}
        </div>
      </Section>

      <Section title="Eigenschappen & gevechtsstats" stepId="eigenschappen" goToStep={goToStep}>
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ABILITY_SCORES.map((ability) => {
            const total = scores[ability.key]
            return (
              <div key={ability.key} className="surface-2 rounded-md px-1 py-2 text-center">
                <p className="m-0 text-[10px] tracking-wider text-muted">{ability.abbr}</p>
                <p className="m-0 text-base font-bold text-ink">{total ?? '—'}</p>
                <p className="m-0 text-xs text-violet">
                  {total === null ? '' : formatModifier(total)}
                </p>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip>HP {derived.hpMax}</Chip>
          <Chip>AC {derived.armorClass}</Chip>
          <Chip>Initiatief {formatSign(derived.initiative)}</Chip>
          <Chip>{derived.speed} ft</Chip>
          {derived.darkvision > 0 && <Chip>Duisterzicht {derived.darkvision} ft</Chip>}
          <Chip>Vaardigheidsbonus +{derived.proficiencyBonus}</Chip>
          {cls && <Chip>Hit die {cls.hitDie}</Chip>}
        </div>
      </Section>

      <Section title="Vaardigheden & talen" stepId="vaardigheden" goToStep={goToStep}>
        <div className="flex flex-wrap gap-1.5">
          {[...new Set([
            ...draft.skillProficiencies,
            ...(race?.skillProficiencies ?? []),
            ...(background?.skills ?? []),
          ])].map((skill) => (
            <Chip key={skill} tone="teal">{skill}</Chip>
          ))}
          {(race?.languages ?? []).map((language) => (
            <Chip key={language}>{language}</Chip>
          ))}
        </div>
      </Section>

      {traits.length > 0 && (
        <Section title="Roleplay" stepId="achtergrond" goToStep={goToStep}>
          <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {traits.map((trait) => (
              <div key={trait.label}>
                <dt className="label mb-1">{trait.label}</dt>
                <dd className="m-0 text-sm leading-relaxed text-ink-soft">{trait.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {isCasterAtLevel1(cls) && (
        <Section title="Spreuken" stepId="spreuken" goToStep={goToStep}>
          {draft.spellsDeferred ? (
            <p className="m-0 text-sm italic text-muted">
              Keuze uitgesteld — kies je spreuken later via de detailpagina.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {draft.cantripIds.map((id) => (
                <Chip key={id} tone="violet">{spellName(id)}</Chip>
              ))}
              {draft.spellIds.map((id) => (
                <Chip key={id}>{spellName(id)}</Chip>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  )
}
