import { FactionCard, ForgeFactionCard } from '@/components/faction/FactionCard'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import type { Faction } from '@/types/faction.types'

export function FactionsTab({
  factions,
  isLoading,
  forging,
  onForge,
  onViewAll,
}: {
  factions: Faction[] | undefined
  isLoading: boolean
  forging: boolean
  onForge: () => void
  onViewAll: () => void
}) {
  return (
    <section aria-labelledby="tab-factions-heading">
      <h2
        id="tab-factions-heading"
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
        Facties
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
            aria-label="Facties in deze kroniek"
          >
            {factions?.slice(0, 6).map((faction) => (
              <li key={faction.id}><FactionCard faction={faction} /></li>
            ))}
            <li>
              <ForgeFactionCard onClick={onForge} loading={forging} />
            </li>
          </ul>
          {factions && factions.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={onViewAll}>
                Alle facties bekijken →
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
