import { useNavigate, useSearchParams } from 'react-router-dom'
import { CharacterWizard } from '@/components/character/CharacterWizard'
import { useCreateCharacter } from '@/hooks/queries/useCharacters'
import { Button } from '@/components/ui/Button'

export default function CharacterWizardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const campaignId = searchParams.get('campaign') ?? undefined
  // "wizard overslaan" volgt het bestaande forge-patroon: lege rij → bewerkpagina
  const createCharacter = useCreateCharacter()

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pg-eyebrow">Spelersperspectief</p>
          <h1 className="pg-display-xl">Nieuw karakter</h1>
          <p className="mb-0 mt-2 text-sm text-ink-soft">
            Bouw je held stap voor stap — of sla de wizard over en vul alles zelf in.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => createCharacter.mutate()}
          loading={createCharacter.isPending}
        >
          Wizard overslaan → leeg karakter
        </Button>
      </header>

      <CharacterWizard
        campaignId={campaignId}
        onComplete={(id) => navigate(`/characters/${id}`)}
        onCancel={() => navigate('/characters')}
      />
    </div>
  )
}
