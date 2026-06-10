import { useEffect, useRef, useState } from 'react'
import { WizardShell } from '@/components/ui/WizardShell'
import { WizardNavBar } from '@/components/ui/WizardNavBar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useCharacterWizard } from '@/hooks/useCharacterWizard'
import { useForgeCharacterFromWizard } from '@/hooks/queries/useCharacters'
import { useAuthStore } from '@/stores/auth.store'
import { StepBasics } from './wizard/StepBasics'
import { StepRace } from './wizard/StepRace'
import { StepClass } from './wizard/StepClass'
import { StepAbilities } from './wizard/StepAbilities'
import { StepSkills } from './wizard/StepSkills'
import { StepBackground } from './wizard/StepBackground'
import { StepSpells } from './wizard/StepSpells'
import { StepReview } from './wizard/StepReview'
import { WizardPreviewPanel } from './wizard/WizardPreviewPanel'
import type { WizardStepId } from '@/types/character_wizard.types'

export interface CharacterWizardProps {
  /** Optional campaign to attach the new character to on completion. */
  campaignId?: string
  onComplete?: (characterId: string) => void
  onCancel?: () => void
}

const STEP_COPY: Record<WizardStepId, { title: string; subtitle: string }> = {
  basis: { title: 'Basis', subtitle: 'Geef je held een naam, een gezicht en een thuis.' },
  ras: { title: 'Kies je ras', subtitle: 'Je ras bepaalt hoe de wereld jou ziet — en hoe jij de wereld ziet.' },
  klasse: { title: 'Kies je klasse', subtitle: 'Je klasse bepaalt hoe je vecht, overleeft en de wereld vormt.' },
  eigenschappen: { title: 'Eigenschappen', subtitle: 'Je zes kerncapaciteiten. Rasbonussen tellen automatisch mee.' },
  vaardigheden: { title: 'Vaardigheden', subtitle: 'Vaardigheid telt je bonus op bij elke check.' },
  achtergrond: { title: 'Achtergrond', subtitle: 'Je achtergrond verankert je in de wereld; je uitlijning stuurt je aard.' },
  spreuken: { title: 'Spreuken', subtitle: 'Een pad voor wie met magie wandelt.' },
  overzicht: { title: 'Overzicht', subtitle: 'Controleer je keuzes en smeed je karakter.' },
}

/** 7-staps begeleide karakteropbouw + overzicht; draft hervatbaar via localStorage. */
export function CharacterWizard({ campaignId, onComplete, onCancel }: CharacterWizardProps) {
  const user = useAuthStore((s) => s.user)
  const wizard = useCharacterWizard(user?.id ?? 'anon', campaignId ?? null)
  const forge = useForgeCharacterFromWizard()
  const [cancelOpen, setCancelOpen] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(false)

  // focus de stap-titel bij stapwissel (niet bij eerste render)
  useEffect(() => {
    if (mounted.current) headingRef.current?.focus()
    mounted.current = true
  }, [wizard.stepIndex])

  const isLastStep = wizard.stepIndex === wizard.steps.length - 1
  const copy = STEP_COPY[wizard.stepId]

  function handleNext() {
    if (!isLastStep) {
      wizard.goNext()
      return
    }
    forge.mutate(wizard.draft, {
      onSuccess: (character) => {
        wizard.clear()
        onComplete?.(character.id)
      },
    })
  }

  function handleCancel() {
    if (wizard.hasProgress) setCancelOpen(true)
    else onCancel?.()
  }

  const stepBody: Record<WizardStepId, React.ReactNode> = {
    basis: <StepBasics draft={wizard.draft} patch={wizard.patch} />,
    ras: <StepRace draft={wizard.draft} selectRace={wizard.selectRace} />,
    klasse: <StepClass draft={wizard.draft} selectClass={wizard.selectClass} patch={wizard.patch} />,
    eigenschappen: <StepAbilities draft={wizard.draft} patch={wizard.patch} />,
    vaardigheden: <StepSkills draft={wizard.draft} patch={wizard.patch} />,
    achtergrond: <StepBackground draft={wizard.draft} patch={wizard.patch} />,
    spreuken: <StepSpells draft={wizard.draft} patch={wizard.patch} />,
    overzicht: <StepReview draft={wizard.draft} goToStep={wizard.goToStep} />,
  }

  return (
    <>
      <WizardShell
        steps={wizard.steps}
        activeIndex={wizard.stepIndex}
        maxReachableIndex={wizard.maxReachableIndex}
        onStepSelect={wizard.goToStep}
        aside={<WizardPreviewPanel draft={wizard.draft} />}
        asideLabel="Karakter-preview"
      >
        <h2 ref={headingRef} tabIndex={-1} className="wizard-step-title">
          {copy.title}
        </h2>
        <p className="wizard-step-subtitle">{copy.subtitle}</p>

        {stepBody[wizard.stepId]}

        <WizardNavBar
          onBack={wizard.stepIndex > 0 ? wizard.goBack : undefined}
          onNext={handleNext}
          canNext={wizard.validation.ok}
          hint={wizard.validation.reason}
          nextLabel={isLastStep ? '⚒ Smeed karakter' : 'Doorgaan →'}
          nextLoading={forge.isPending}
        />

        {onCancel && (
          <p className="m-0 mt-3 text-right">
            <button type="button" className="btn-link" onClick={handleCancel}>
              Annuleren
            </button>
          </p>
        )}
      </WizardShell>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          setCancelOpen(false)
          wizard.clear()
          onCancel?.()
        }}
        title="Wizard verlaten?"
        confirmLabel="Verlaat en verwijder draft"
      >
        Je voortgang in deze wizard wordt verwijderd. Er is nog geen karakter aangemaakt.
      </ConfirmDialog>
    </>
  )
}
