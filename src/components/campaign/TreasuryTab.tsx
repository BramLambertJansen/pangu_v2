import { ItemCard, ForgeItemCard } from '@/components/item/ItemCard'
import { Spinner } from '@/components/ui/Spinner'
import type { Item } from '@/types/item.types'

export function TreasuryTab({
  allItems,
  isLoading,
  forging,
  onForge,
  onViewAll,
}: {
  allItems: Item[] | undefined
  isLoading: boolean
  forging: boolean
  onForge: () => void
  onViewAll: () => void
}) {
  const dmPoolItems = allItems?.filter(i => !i.character_id) ?? []

  return (
    <section aria-labelledby="tab-treasury-heading">
      <h2
        id="tab-treasury-heading"
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
        Schatkist
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
            aria-label="Items in DM-schatkist"
          >
            {dmPoolItems.slice(0, 6).map((item) => (
              <li key={item.id}><ItemCard item={item} /></li>
            ))}
            <li>
              <ForgeItemCard onClick={onForge} loading={forging} />
            </li>
          </ul>
          {allItems && allItems.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                onClick={onViewAll}
              >
                Alle items bekijken →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
