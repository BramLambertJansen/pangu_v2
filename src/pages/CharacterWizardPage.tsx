import { useNavigate, useSearchParams } from 'react-router-dom'
import { CharacterWizard } from '@/components/character/CharacterWizard'
import { useCreateCharacter } from '@/hooks/queries/useCharacters'
import { Starfield } from '@/components/ui/Starfield'

export default function CharacterWizardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const campaignId = searchParams.get('campaign') ?? undefined
  // "wizard overslaan" volgt het bestaande forge-patroon: lege rij → bewerkpagina
  const createCharacter = useCreateCharacter()

  return (
    <div className="wizard-fullscreen">
      <div aria-hidden="true" className="wizard-fullscreen-bg" />
      <Starfield />
      <main id="main-content" className="wizard-fullscreen-main">
        <CharacterWizard
          fullHeight
          campaignId={campaignId}
          onComplete={(id) => navigate(`/characters/${id}`)}
          onCancel={() => navigate('/characters')}
          onSkip={() => createCharacter.mutate()}
          skipLoading={createCharacter.isPending}
        />
      </main>
    </div>
  )
}
