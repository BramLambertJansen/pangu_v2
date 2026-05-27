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
import { EncounterCard, ForgeEncounterCard } from '@/components/encounter/EncounterCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import type { Encounter } from '@/types/encounter.types'
import { useAuthStore } from '@/stores/auth.store'
import { useCampaign } from '@/hooks/queries/useCampaign'
import { useCampaignEncounters } from '@/hooks/queries/useCampaignEncounters'

export default function EncountersPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  const [creatingEncounter, setCreatingEncounter] = useState(false)

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId)
  const { data: encounters, isLoading: encountersLoading } = useCampaignEncounters(campaignId)

  // Garbage-collect uncommitted drafts older than 30 minutes
  useEffect(() => {
    if (!user?.id) return
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    void (async () => {
      try {
      const { data } = await supabase
        .from('encounters')
        .select('id')
        .eq('campaign_id', campaignId!)
        .eq('committed', false)
        .lt('created_at', cutoff)
      if (data?.length) {
        await supabase.from('encounters').delete().in('id', data.map((r) => r.id))
      }
      } catch (err) {
        console.warn("[GC] draft cleanup failed:", err)
      }
    })()
  }, [user?.id])

  const createEncounter = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('encounters')
        .insert({
          campaign_id: campaignId!,
          user_id: user.id,
          name: 'Nieuw gevecht',
          status: 'draft',
        })
        .select()
        .single()
      if (error) throw error
      return data as Encounter
    },
    onSuccess: (newEncounter) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.encounters(campaignId!) })
      navigate(`/encounters/${newEncounter.id}/edit`, {
        state: { isNew: true, campaignId },
      })
    },
    onError: () => {
      toast.error('Gevecht aanmaken mislukt')
      setCreatingEncounter(false)
    },
  })

  function handleCreateEncounter() {
    setCreatingEncounter(true)
    createEncounter.mutate()
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
          { label: 'Gevechten' },
        ]} />
      </div>

      {/* Page header */}
      <header style={{ marginBottom: 32 }}>
        <p className="pangu-eyebrow">Kroniek — {campaign.name}</p>
        <h1 className="pangu-display-xl">Gevechten</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Plan en beheer de gevechten van deze kroniek.
        </p>
      </header>

      <WorldDetailDivider label={`${encounters?.length ?? 0} gevecht${encounters?.length !== 1 ? 'en' : ''}`} />

      {/* Encounter grid */}
      <div style={{ marginTop: 24 }}>
        {encountersLoading ? (
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)', listStyle: 'none', padding: 0, margin: 0 }} aria-label="Gevechten laden..." aria-live="polite">
            <EntityCardSkeleton count={3} />
          </ul>
        ) : (
          <>
            {(!encounters || encounters.length === 0) && (
              <EmptyState
                title="Nog geen gevechten"
                description="Bouw het eerste gevecht. Elke confrontatie begint met een plan."
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {encounters?.map((encounter) => (
                <EncounterCard key={encounter.id} encounter={encounter} />
              ))}
              <ForgeEncounterCard onClick={handleCreateEncounter} loading={creatingEncounter} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
