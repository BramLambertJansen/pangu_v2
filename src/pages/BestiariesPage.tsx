import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Spinner } from '@/components/ui/Spinner'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { BestiaryCard, ForgeBestiaryCard } from '@/components/bestiary/BestiaryCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import type { Bestiary } from '@/types/bestiary.types'
import { useAuthStore } from '@/stores/auth.store'
import { useWorld } from '@/hooks/queries/useWorld'
import { useWorldBestiaries } from '@/hooks/queries/useWorldBestiaries'

export default function BestiariesPage() {
  const { id: worldId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  const [creatingBestiary, setCreatingBestiary] = useState(false)

  const { data: world, isLoading: worldLoading } = useWorld(worldId)
  const { data: bestiaries, isLoading: bestiariesLoading } = useWorldBestiaries(worldId)

  // Garbage-collect uncommitted drafts older than 30 minutes
  useEffect(() => {
    if (!user?.id) return
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    void supabase
      .from('bestiaries')
      .delete()
      .eq('world_id', worldId!)
      .eq('committed', false)
      .lt('created_at', cutoff)
  }, [user?.id])

  const createBestiary = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('bestiaries')
        .insert({
          world_id: worldId!,
          user_id: user.id,
          name: 'Nieuw wezen',
          status: 'draft',
        })
        .select()
        .single()
      if (error) throw error
      return data as Bestiary
    },
    onSuccess: (newBestiary) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.bestiaries(worldId!) })
      navigate(`/bestiary/${newBestiary.id}/edit`, {
        state: { isNew: true, worldId },
      })
    },
    onError: () => {
      toast.error('Wezen aanmaken mislukt')
      setCreatingBestiary(false)
    },
  })

  function handleCreateBestiary() {
    setCreatingBestiary(true)
    createBestiary.mutate()
  }

  if (worldLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Wereld laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!world) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Wereld niet gevonden.</p>
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/worlds')} style={{ marginTop: 16 }}>
          ← Terug naar werelden
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumbs items={[
          { label: 'Werelden', to: '/worlds' },
          { label: world.name, to: `/worlds/${worldId}` },
          { label: 'Bestiarium' },
        ]} />
      </div>

      {/* Page header */}
      <header style={{ marginBottom: 32 }}>
        <p className="pangu-eyebrow">Wereld — {world.name}</p>
        <h1 className="pangu-display-xl">Bestiarium</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Catalogiseer de wezens en monsters van deze wereld.
        </p>
      </header>

      <WorldDetailDivider label={`${bestiaries?.length ?? 0} wezen${bestiaries?.length !== 1 ? 's' : ''}`} />

      {/* Bestiary grid */}
      <div style={{ marginTop: 24 }}>
        {bestiariesLoading ? (
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)', listStyle: 'none', padding: 0, margin: 0 }} aria-label="Bestiarium laden..." aria-live="polite">
            <EntityCardSkeleton count={3} />
          </ul>
        ) : (
          <>
            {(!bestiaries || bestiaries.length === 0) && (
              <EmptyState
                title="Nog geen wezens"
                description="Vul het bestiarium met de gevaarlijke en mysterieuze wezens van deze wereld."
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bestiaries?.map((bestiary) => (
                <BestiaryCard key={bestiary.id} bestiary={bestiary} />
              ))}
              <ForgeBestiaryCard onClick={handleCreateBestiary} loading={creatingBestiary} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
