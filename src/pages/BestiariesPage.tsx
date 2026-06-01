import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { BestiaryRow, ForgeBestiaryCard } from '@/components/bestiary/BestiaryCard'
import { DmBestiaryPanel } from '@/components/bestiary/DmBestiaryPanel'
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
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: world, isLoading: worldLoading } = useWorld(worldId)
  const { data: bestiaries, isLoading: bestiariesLoading } = useWorldBestiaries(worldId)

  // Set first bestiary as selected when data loads
  useEffect(() => {
    if (bestiaries && bestiaries.length > 0 && !selectedId) {
      setSelectedId(bestiaries[0].id)
    }
  }, [bestiaries, selectedId])

  // Garbage-collect uncommitted drafts older than 30 minutes
  useEffect(() => {
    if (!user?.id) return
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    void (async () => {
      try {
        const { data } = await supabase
          .from('bestiaries')
          .select('id')
          .eq('world_id', worldId!)
          .eq('committed', false)
          .lt('created_at', cutoff)
        if (data?.length) {
          await supabase.from('bestiaries').delete().in('id', data.map((r) => r.id))
        }
      } catch (err) {
        console.warn('[GC] draft cleanup failed:', err)
      }
    })()
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

  const committed = bestiaries?.filter(b => b.committed) ?? []
  const selected = committed.find(b => b.id === selectedId) ?? committed[0] ?? null

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

      <WorldDetailDivider label={`${committed.length} wezen${committed.length !== 1 ? 's' : ''}`} />

      {/* Splitscreen */}
      <style>{`
        .bestiary-split { display: grid; grid-template-columns: minmax(240px, 2fr) minmax(320px, 3fr); gap: 20px; align-items: start; }
        @media (max-width: 700px) { .bestiary-split { grid-template-columns: 1fr; } }
      `}</style>
      <div style={{ marginTop: 24 }}>
        {bestiariesLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
            <Spinner size="md" />
          </div>
        ) : committed.length === 0 ? (
          <>
            <EmptyState
              title="Nog geen wezens"
              description="Vul het bestiarium met de gevaarlijke en mysterieuze wezens van deze wereld."
            />
            <div style={{ marginTop: 16, maxWidth: 280 }}>
              <ForgeBestiaryCard onClick={handleCreateBestiary} loading={creatingBestiary} />
            </div>
          </>
        ) : (
          <div className="bestiary-split">
            {/* Left: bestiary list */}
            <div>
              <ul
                style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', padding: 0, margin: '0 0 10px' }}
                role="list"
                aria-label="Wezens in dit bestiarium"
              >
                {committed.map((bestiary) => (
                  <li key={bestiary.id}>
                    <BestiaryRow
                      bestiary={bestiary}
                      selected={bestiary.id === (selected?.id)}
                      onSelect={() => setSelectedId(bestiary.id)}
                    />
                  </li>
                ))}
              </ul>
              <ForgeBestiaryCard onClick={handleCreateBestiary} loading={creatingBestiary} />
            </div>

            {/* Right: DM stat block panel */}
            {selected && (
              <div style={{ position: 'sticky', top: 20, maxHeight: 'calc(100vh - 180px)' }}>
                <DmBestiaryPanel bestiary={selected} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
