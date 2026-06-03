import { LocationCard, ForgeLocationCard } from '@/components/location/LocationCard'
import { Spinner } from '@/components/ui/Spinner'
import type { Location } from '@/types/location.types'

export function LocationsTab({
  locations,
  isLoading,
  forging,
  onForge,
  onViewAll,
}: {
  locations: Location[] | undefined
  isLoading: boolean
  forging: boolean
  onForge: () => void
  onViewAll: () => void
}) {
  return (
    <section aria-labelledby="tab-locations-heading">
      <h2
        id="tab-locations-heading"
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
        Locaties
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
            aria-label="Locaties in deze kroniek"
          >
            {locations?.map((loc) => (
              <li key={loc.id}><LocationCard location={loc} /></li>
            ))}
            <li>
              <ForgeLocationCard onClick={onForge} loading={forging} />
            </li>
          </ul>
          {locations && locations.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                onClick={onViewAll}
              >
                Alle locaties bekijken →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
