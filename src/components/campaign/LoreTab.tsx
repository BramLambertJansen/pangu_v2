import { LoreCard, ForgeLoreCard } from '@/components/lore/LoreCard'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import type { Lore } from '@/types/lore.types'

export function LoreTab({
  loreItems,
  isLoading,
  forging,
  onForge,
  onViewAll,
}: {
  loreItems: Lore[] | undefined
  isLoading: boolean
  forging: boolean
  onForge: () => void
  onViewAll: () => void
}) {
  return (
    <section aria-labelledby="tab-lore-heading">
      <h2
        id="tab-lore-heading"
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
        Lore
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
            aria-label="Lore in deze kroniek"
          >
            {loreItems?.map((lore) => (
              <li key={lore.id}><LoreCard lore={lore} /></li>
            ))}
            <li>
              <ForgeLoreCard onClick={onForge} loading={forging} />
            </li>
          </ul>
          {loreItems && loreItems.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={onViewAll}>
                Alle lore bekijken →
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
