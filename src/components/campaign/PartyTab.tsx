import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { PartySplitView, PartyVitalsGrid } from '@/components/campaign/PartySplitView'
import type { Character } from '@/types/character.types'

export function PartyTab({
  characters,
  isLoading,
  onAddHero,
}: {
  characters: Character[]
  isLoading: boolean
  onAddHero: () => void
}) {
  return (
    <section aria-labelledby="tab-party-heading">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2
            id="tab-party-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(20px, 3.5vw, 28px)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Helden
          </h2>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            {characters.length} speler{characters.length !== 1 ? 's' : ''}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onAddHero} aria-label="Held toevoegen">
          + Held toevoegen
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
          <Spinner size="md" />
        </div>
      ) : characters.length > 0 ? (
        <>
          <PartySplitView characters={characters} />
          <div style={{ marginTop: 28 }}>
            <PartyVitalsGrid characters={characters} />
          </div>
        </>
      ) : (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            background: 'var(--surface)',
            border: '1px dashed var(--hairline)',
            borderRadius: 'var(--r-xl)',
          }}
        >
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 8px', fontStyle: 'italic' }}>
            Nog geen helden in deze kroniek.
          </p>
          <p style={{ fontSize: 12, color: 'var(--subtle)', margin: '0 0 16px' }}>
            Spelers koppelen hun karakter via Karakters → Bewerken → Kroniek.
          </p>
          <Button variant="ghost" size="sm" onClick={onAddHero}>
            Naar karakters →
          </Button>
        </div>
      )}
    </section>
  )
}
