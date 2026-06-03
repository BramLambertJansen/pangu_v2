import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import { CharacterCard, ForgeCharacterCard } from '@/components/character/CharacterCard'
import { useCharacters, useCreateCharacter } from '@/hooks/queries/useCharacters'
import { useDraftGC } from '@/hooks/useDraftGC'

export default function CharactersPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const [search, setSearch] = useState('')

  const { data: characters, isLoading } = useCharacters()
  const createCharacter = useCreateCharacter()

  useDraftGC('characters', 'user_id', user?.id)

  const filtered = characters
    ? characters.filter((c) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          (c.character_class ?? '').toLowerCase().includes(q) ||
          (c.character_race ?? '').toLowerCase().includes(q)
        )
      })
    : []

  return (
    <div>
      {/* Page header */}
      <header style={{ marginBottom: 32 }}>
        <p className="pangu-eyebrow">Spelersperspectief</p>
        <h1 className="pangu-display-xl">Mijn karakters</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Beheer jouw personages en karakterbladen.
        </p>
      </header>

      {/* Search */}
      {!isLoading && characters && characters.length > 0 && (
        <div style={{ marginBottom: 24, maxWidth: 360 }}>
          <input
            className="pangu-input"
            type="search"
            placeholder="Zoek op naam, klasse of ras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Karakters zoeken"
          />
        </div>
      )}

      <WorldDetailDivider label={`${filtered.length} karakter${filtered.length !== 1 ? 's' : ''}`} />

      {/* Character grid */}
      <div style={{ marginTop: 24 }}>
        {isLoading ? (
          <ul
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)', listStyle: 'none', padding: 0, margin: 0 }}
            aria-label="Karakters laden..."
            aria-live="polite"
          >
            <EntityCardSkeleton count={3} />
          </ul>
        ) : (
          <>
            {(!characters || characters.length === 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                <EmptyState
                  title="Nog geen karakters"
                  description="Maak je eerste personage aan en begin je avontuur."
                />
                <div style={{ width: '100%', maxWidth: 320 }}>
                  <ForgeCharacterCard onClick={() => createCharacter.mutate()} loading={createCharacter.isPending} />
                </div>
              </div>
            ) : (
              <>
                {filtered.length === 0 && search && (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                      Geen resultaten voor <strong style={{ color: 'var(--ink-soft)' }}>"{search}"</strong>.
                    </p>
                    <button
                      type="button"
                      className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                      onClick={() => setSearch('')}
                      style={{ marginTop: 12 }}
                    >
                      Wis zoekopdracht
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((character) => (
                    <CharacterCard key={character.id} character={character} />
                  ))}
                  <ForgeCharacterCard onClick={() => createCharacter.mutate()} loading={createCharacter.isPending} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
