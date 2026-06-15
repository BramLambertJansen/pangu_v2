import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchBar } from '@/components/ui/SearchBar'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import { CharacterCard, ForgeCharacterCard } from '@/components/character/CharacterCard'
import { useCharacters } from '@/hooks/queries/useCharacters'
import { useDraftGC } from '@/hooks/useDraftGC'

export default function CharactersPage() {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: characters, isLoading } = useCharacters()

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
        <p className="pg-eyebrow">Spelersperspectief</p>
        <h1 className="pg-display-xl">Mijn karakters</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Beheer jouw personages en karakterbladen.
        </p>
      </header>

      {/* Search */}
      {!isLoading && characters && characters.length > 0 && (
        <div style={{ marginBottom: 24, maxWidth: 360 }}>
          <SearchBar
            value={search}
            onValueChange={setSearch}
            placeholder="Zoek op naam, klasse of ras..."
            label="Karakters zoeken"
          />
        </div>
      )}

      <OrnateDivider label={`${filtered.length} karakter${filtered.length !== 1 ? 's' : ''}`} />

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
                  <ForgeCharacterCard onClick={() => navigate('/characters/new')} />
                </div>
              </div>
            ) : (
              <>
                {filtered.length === 0 && search && (
                  <EmptyState
                    icon="🔍"
                    title="Geen resultaten"
                    description={`Niets gevonden voor "${search}".`}
                    action={
                      <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
                        Wis zoekopdracht
                      </Button>
                    }
                  />
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((character) => (
                    <CharacterCard key={character.id} character={character} />
                  ))}
                  <ForgeCharacterCard onClick={() => navigate('/characters/new')} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
