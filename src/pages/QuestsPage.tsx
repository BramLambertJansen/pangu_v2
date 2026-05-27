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
import { QuestCard, ForgeQuestCard } from '@/components/quest/QuestCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import type { Quest } from '@/types/quest.types'
import { useAuthStore } from '@/stores/auth.store'
import { useCampaign } from '@/hooks/queries/useCampaign'
import { useCampaignQuests } from '@/hooks/queries/useCampaignQuests'

export default function QuestsPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  const [creatingQuest, setCreatingQuest] = useState(false)

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId)
  const { data: quests, isLoading: questsLoading } = useCampaignQuests(campaignId)

  // Garbage-collect uncommitted drafts older than 30 minutes
  useEffect(() => {
    if (!user?.id) return
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    void (async () => {
      const { data } = await supabase
        .from('quests')
        .select('id')
        .eq('campaign_id', campaignId!)
        .eq('committed', false)
        .lt('created_at', cutoff)
      if (data?.length) {
        await supabase.from('quests').delete().in('id', data.map((r) => r.id))
      }
    })()
  }, [user?.id])

  const createQuest = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('quests')
        .insert({
          campaign_id: campaignId!,
          user_id: user.id,
          name: 'Nieuwe quest',
          status: 'draft',
        })
        .select()
        .single()
      if (error) throw error
      return data as Quest
    },
    onSuccess: (newQuest) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.quests(campaignId!) })
      navigate(`/quests/${newQuest.id}/edit`, {
        state: { isNew: true, campaignId },
      })
    },
    onError: () => {
      toast.error('Quest aanmaken mislukt')
      setCreatingQuest(false)
    },
  })

  function handleCreateQuest() {
    setCreatingQuest(true)
    createQuest.mutate()
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
          { label: 'Quests' },
        ]} />
      </div>

      {/* Page header */}
      <header style={{ marginBottom: 32 }}>
        <p className="pangu-eyebrow">Kroniek — {campaign.name}</p>
        <h1 className="pangu-display-xl">Quests</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Beheer de quests van deze kroniek.
        </p>
      </header>

      <WorldDetailDivider label={`${quests?.length ?? 0} quest${quests?.length !== 1 ? 's' : ''}`} />

      {/* Quest grid */}
      <div style={{ marginTop: 24 }}>
        {questsLoading ? (
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)', listStyle: 'none', padding: 0, margin: 0 }} aria-label="Quests laden..." aria-live="polite">
            <EntityCardSkeleton count={3} />
          </ul>
        ) : (
          <>
            {(!quests || quests.length === 0) && (
              <EmptyState
                title="Nog geen quests"
                description="Schrijf de eerste opdracht. Elk avontuur begint met een quest."
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quests?.map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
              <ForgeQuestCard onClick={handleCreateQuest} loading={creatingQuest} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
