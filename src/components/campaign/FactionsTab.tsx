import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { FactionSplitView } from '@/components/faction/FactionSplitView'
import type { Faction } from '@/types/faction.types'
import type { Npc } from '@/types/npc.types'

export function FactionsTab({
  factions,
  npcs,
  isLoading,
  forging,
  onForge,
  onViewAll,
}: {
  factions: Faction[] | undefined
  npcs?: Npc[]
  isLoading: boolean
  forging: boolean
  onForge: () => void
  onViewAll: () => void
}) {
  const committed = factions?.filter(f => f.committed) ?? []

  return (
    <section aria-labelledby="tab-factions-heading">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2
            id="tab-factions-heading"
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
            Facties
          </h2>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            {committed.length} politieke macht{committed.length !== 1 ? 'en' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onForge}
            disabled={forging}
            aria-busy={forging}
          >
            {forging ? 'Aanmaken…' : '+ Factie toevoegen'}
          </Button>
          {committed.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              Alle facties →
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
          <Spinner size="md" />
        </div>
      ) : committed.length > 0 ? (
        <FactionSplitView factions={committed} npcs={npcs} />
      ) : (
        <div
          style={{
            padding: 32, textAlign: 'center',
            background: 'var(--surface)',
            border: '1px dashed var(--hairline)',
            borderRadius: 'var(--r-xl)',
          }}
        >
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 8px', fontStyle: 'italic' }}>
            Nog geen facties in deze kroniek.
          </p>
          <Button variant="ghost" size="sm" onClick={onForge} disabled={forging}>
            {forging ? 'Aanmaken…' : '+ Factie toevoegen'}
          </Button>
        </div>
      )}
    </section>
  )
}
