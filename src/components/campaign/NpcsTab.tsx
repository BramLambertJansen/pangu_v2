import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { NpcSplitView } from '@/components/npc/NpcSplitView'
import type { Npc } from '@/types/npc.types'
import type { Faction } from '@/types/faction.types'

export function NpcsTab({
  npcs,
  factions,
  isLoading,
  forging,
  onForge,
  onViewAll,
}: {
  npcs: Npc[]
  factions?: Faction[]
  isLoading: boolean
  forging: boolean
  onForge: () => void
  onViewAll: () => void
}) {
  return (
    <section aria-labelledby="tab-npcs-heading">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2
            id="tab-npcs-heading"
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
            NPC's
          </h2>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            {npcs.length} personage{npcs.length !== 1 ? 's' : ''}
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
            {forging ? 'Aanmaken…' : '+ NPC toevoegen'}
          </Button>
          {npcs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              Alle NPCs →
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
          <Spinner size="md" />
        </div>
      ) : npcs.length > 0 ? (
        <NpcSplitView npcs={npcs} factions={factions} />
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
            Nog geen NPC's in deze kroniek.
          </p>
          <Button variant="ghost" size="sm" onClick={onForge} disabled={forging}>
            {forging ? 'Aanmaken…' : '+ NPC toevoegen'}
          </Button>
        </div>
      )}
    </section>
  )
}
