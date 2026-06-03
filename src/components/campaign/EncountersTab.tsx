import { EncounterCard, ForgeEncounterCard } from '@/components/encounter/EncounterCard'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { Encounter } from '@/types/encounter.types'

export function EncountersTab({
  encounters,
  isLoading,
  forging,
  onForge,
  onViewAll,
}: {
  encounters: Encounter[] | undefined
  isLoading: boolean
  forging: boolean
  onForge: () => void
  onViewAll: () => void
}) {
  return (
    <section aria-labelledby="tab-encounters-heading">
      <h2
        id="tab-encounters-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 4vw, 30px)',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          margin: '0 0 24px',
        }}
      >
        Gevechten
      </h2>
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
          <Spinner size="md" />
        </div>
      ) : (
        <>
          <ul
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--sp-5)',
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
            role="list"
            aria-label="Gevechten in deze kroniek"
          >
            {encounters?.slice(0, 6).map((encounter) => (
              <li key={encounter.id}><EncounterCard encounter={encounter} /></li>
            ))}
            <li>
              <ForgeEncounterCard onClick={onForge} loading={forging} />
            </li>
          </ul>
          {encounters && encounters.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm"
                onClick={onViewAll}
              >
                Alle gevechten bekijken →
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
