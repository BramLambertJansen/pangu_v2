import { useState } from 'react'
import { PartyMemberRow } from '@/components/character/CharacterCard'
import { DmCharacterPanel } from '@/components/character/DmCharacterPanel'
import { Spinner } from '@/components/ui/Spinner'
import type { Character } from '@/types/character.types'
import type { Item } from '@/types/item.types'

export function PartyTab({
  characters,
  isLoading,
  allItems,
  onAddHero,
}: {
  characters: Character[]
  isLoading: boolean
  allItems: Item[]
  onAddHero: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => characters[0]?.id ?? null
  )

  const selected = characters.find(c => c.id === selectedId) ?? characters[0] ?? null
  const characterItems = selected ? allItems.filter(i => i.character_id === selected.id) : []

  return (
    <section aria-labelledby="tab-party-heading">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2
          id="tab-party-heading"
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
          The Party
        </h2>
        <button
          type="button"
          className="pangu-btn pangu-btn-ghost pangu-btn-sm"
          onClick={onAddHero}
          aria-label="Held toevoegen — ga naar karakters"
        >
          + Held toevoegen
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
          <Spinner size="md" />
        </div>
      ) : characters.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 2fr) minmax(320px, 3fr)',
          gap: 20,
          alignItems: 'start',
        }}>
          {/* Left: party member list */}
          <ul
            style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}
            role="list"
            aria-label="Karakters in deze kroniek"
          >
            {characters.map((character) => (
              <li key={character.id}>
                <PartyMemberRow
                  character={character}
                  selected={character.id === (selected?.id)}
                  onSelect={() => setSelectedId(character.id)}
                />
              </li>
            ))}
          </ul>

          {/* Right: DM detail panel */}
          {selected && (
            <div style={{ position: 'sticky', top: 20, maxHeight: 'calc(100vh - 180px)' }}>
              <DmCharacterPanel character={selected} items={characterItems} />
            </div>
          )}
        </div>
      ) : (
        <div className="pangu-surface" style={{ padding: 24, textAlign: 'center', borderStyle: 'dashed' }}>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 6px', fontStyle: 'italic' }}>
            Nog geen helden in deze kroniek.
          </p>
          <p style={{ fontSize: 12, color: 'var(--subtle)', margin: 0 }}>
            Spelers kunnen hun karakter koppelen via het karakterscherm (Karakters → Bewerken → Kampagne).
          </p>
        </div>
      )}
    </section>
  )
}
