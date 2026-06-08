import { StubPanel } from '@/components/ui/StubPanel'

export interface CharacterWizardProps {
  /** Optional campaign to attach the new character to on completion. */
  campaignId?: string
  onComplete?: (characterId: string) => void
  onCancel?: () => void
}

/** STUB — 7-step guided character creator (basis → ras → klasse → kenmerken → vaardigheden → achtergrond → spreuken). */
export function CharacterWizard(_props: CharacterWizardProps) {
  return (
    <StubPanel
      title="Karakter-wizard"
      description="Begeleide karakteropbouw in 7 stappen met voortgangsindicator en lokale tussenopslag."
    />
  )
}
