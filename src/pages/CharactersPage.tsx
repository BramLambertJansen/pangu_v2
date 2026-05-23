import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Spinner } from '@/components/ui/Spinner'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import { CharacterCard, ForgeCharacterCard } from '@/components/character/CharacterCard'
import { useAuthStore } from '@/stores/auth.store'
import { useCharacters } from '@/hooks/queries/useCharacters'
import type { Character } from '@/types/character.types'

export default function CharactersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  const [creatingCharacter, setCreatingCharacter] = useState(false)
  const [search, setSearch] = useState('')

  const { data: characters, isLoading } = useCharacters()

  const createCharacter = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('characters')
        .insert({
          user_id: user.id,
          name: 'Nieuw karakter',
          status: 'active',
        })
        .select()
        .single()
      if (error) throw error
      return data as Character
    },
    onSuccess: (newCharacter) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
      navigate(`/characters/${newCharacter.id}/edit`, {
        state: { isNew: true },
      })
    },
    onError: () => {
      toast.error('Karakter aanmaken mislukt')
      setCreatingCharacter(false)
    },
  })

  function handleCreateCharacter() {
    setCreatingCharacter(true)
    createCharacter.mutate()
  }

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
            {(!characters || characters.length === 0) && (
              <EmptyState
                title="Nog geen karakters"
                description="Maak je eerste personage aan en begin je avontuur."
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((character) => (
                <CharacterCard key={character.id} character={character} />
              ))}
              <ForgeCharacterCard onClick={handleCreateCharacter} loading={creatingCharacter} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
