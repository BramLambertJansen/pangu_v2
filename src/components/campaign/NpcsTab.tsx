import { useState } from 'react'
import { NpcRow } from '@/components/npc/NpcCard'
import { DmNpcPanel } from '@/components/npc/DmNpcPanel'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { Npc } from '@/types/npc.types'

export function NpcsTab({
  npcs,
  isLoading,
  forging,
  onForge,
  onViewAll,
}: {
  npcs: Npc[]
  isLoading: boolean
  forging: boolean
  onForge: () => void
  onViewAll: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => npcs[0]?.id ?? null
  )
  const selected = npcs.find(n => n.id === selectedId) ?? npcs[0] ?? null

  return (
    <section aria-labelledby="tab-npcs-heading">
      <style>{`
        .npc-split { display: grid; grid-template-columns: minmax(240px, 2fr) minmax(300px, 3fr); gap: 20px; align-items: start; }
        @media (max-width: 700px) { .npc-split { grid-template-columns: 1fr; } }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2
          id="tab-npcs-heading"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 4vw, 30px)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          NPC's
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" size="sm"
            onClick={onForge}
            disabled={forging}
            aria-busy={forging}
          >
            {forging ? 'Aanmaken…' : '+ NPC toevoegen'}
          </Button>
          {npcs.length > 0 && (
            <Button variant="ghost" size="sm"
              onClick={onViewAll}
            >
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
        <div className="npc-split">
          <ul
            style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}
            role="list"
            aria-label="NPC's in deze kroniek"
          >
            {npcs.map((npc) => (
              <li key={npc.id}>
                <NpcRow
                  npc={npc}
                  selected={npc.id === (selected?.id)}
                  onSelect={() => setSelectedId(npc.id)}
                />
              </li>
            ))}
          </ul>

          {selected && (
            <div style={{ position: 'sticky', top: 20, maxHeight: 'calc(100vh - 180px)' }}>
              <DmNpcPanel npc={selected} />
            </div>
          )}
        </div>
      ) : (
        <div className="pangu-surface" style={{ padding: 24, textAlign: 'center', borderStyle: 'dashed' }}>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 6px', fontStyle: 'italic' }}>
            Nog geen NPC's in deze kroniek.
          </p>
          <p style={{ fontSize: 12, color: 'var(--subtle)', margin: 0 }}>
            Voeg een NPC toe om personages bij te houden.
          </p>
        </div>
      )}
    </section>
  )
}
