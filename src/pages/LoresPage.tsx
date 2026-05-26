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
import { LoreCard, ForgeLoreCard } from '@/components/lore/LoreCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import type { Lore } from '@/types/lore.types'
import { useAuthStore } from '@/stores/auth.store'
import { useCampaign } from '@/hooks/queries/useCampaign'
import { useCampaignLore } from '@/hooks/queries/useCampaignLore'

export default function LoresPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  const [creatingLore, setCreatingLore] = useState(false)

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId)
  const { data: loreItems, isLoading: loreLoading } = useCampaignLore(campaignId)

  // Garbage-collect uncommitted drafts older than 30 minutes
  useEffect(() => {
    if (!user?.id) return
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    void supabase
      .from('lore')
      .delete()
      .eq('campaign_id', campaignId!)
      .eq('committed', false)
      .lt('created_at', cutoff)
  }, [user?.id])

  const createLore = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('lore')
        .insert({
          campaign_id: campaignId!,
          user_id: user.id,
          name: 'Nieuwe lore',
          status: 'draft',
        })
        .select()
        .single()
      if (error) throw error
      return data as Lore
    },
    onSuccess: (newLore) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.lore(campaignId!) })
      navigate(`/lore/${newLore.id}/edit`, {
        state: { isNew: true, campaignId },
      })
    },
    onError: () => {
      toast.error('Lore aanmaken mislukt')
      setCreatingLore(false)
    },
  })

  function handleCreateLore() {
    setCreatingLore(true)
    createLore.mutate()
  }

  if (campaignLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Kroniek laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Kroniek niet gevonden.</p>
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumbs items={[
          { label: 'Wereld', to: `/worlds/${campaign.world_id}` },
          { label: campaign.name, to: `/campaigns/${campaignId}` },
          { label: 'Lore' },
        ]} />
      </div>

      {/* Page header */}
      <header style={{ marginBottom: 32 }}>
        <p className="pangu-eyebrow">Kroniek — {campaign.name}</p>
        <h1 className="pangu-display-xl">Lore</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Beheer de lore van deze kroniek.
        </p>
      </header>

      <WorldDetailDivider label={`${loreItems?.length ?? 0} lore-item${loreItems?.length !== 1 ? 's' : ''}`} />

      {/* Lore grid */}
      <div style={{ marginTop: 24 }}>
        {loreLoading ? (
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)', listStyle: 'none', padding: 0, margin: 0 }} aria-label="Lore laden..." aria-live="polite">
            <EntityCardSkeleton count={3} />
          </ul>
        ) : (
          <>
            {(!loreItems || loreItems.length === 0) && (
              <EmptyState
                title="Nog geen lore"
                description="Schrijf het eerste verhaal. Elke legende begint met een eerste woord."
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loreItems?.map((lore) => (
                <LoreCard key={lore.id} lore={lore} />
              ))}
              <ForgeLoreCard onClick={handleCreateLore} loading={creatingLore} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
