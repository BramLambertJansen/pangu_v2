import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/Spinner'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { FactionCard, ForgeFactionCard } from '@/components/faction/FactionCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import { useAuthStore } from '@/stores/auth.store'
import { useCampaign } from '@/hooks/queries/useCampaign'
import { useCampaignFactions, useCreateCampaignFaction } from '@/hooks/queries/useCampaignFactions'

export default function FactionsPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId)
  const { data: factions, isLoading: factionsLoading } = useCampaignFactions(campaignId)
  const createFaction = useCreateCampaignFaction(campaignId!)

  // Garbage-collect uncommitted drafts older than 30 minutes
  useEffect(() => {
    if (!user?.id || !campaignId) return
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    void (async () => {
      try {
        const { data } = await supabase
          .from('factions')
          .select('id')
          .eq('campaign_id', campaignId)
          .eq('committed', false)
          .lt('created_at', cutoff)
        if (data?.length) {
          await supabase.from('factions').delete().in('id', data.map((r) => r.id))
        }
      } catch (err) {
        console.warn('[GC] faction draft cleanup failed:', err)
      }
    })()
  }, [user?.id, campaignId])

  function handleCreate() {
    createFaction.mutate(undefined, {
      onError: () => toast.error('Factie aanmaken mislukt'),
    })
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
      <div style={{ marginBottom: 24 }}>
        <Breadcrumbs items={[
          { label: 'Wereld', to: `/worlds/${campaign.world_id}` },
          { label: campaign.name, to: `/campaigns/${campaignId}` },
          { label: 'Facties' },
        ]} />
      </div>

      <header style={{ marginBottom: 32 }}>
        <p className="pangu-eyebrow">Kroniek — {campaign.name}</p>
        <h1 className="pangu-display-xl">Facties</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Beheer de organisaties en machtsgroeperingen in deze kroniek.
        </p>
      </header>

      <WorldDetailDivider label={`${factions?.length ?? 0} factie${factions?.length !== 1 ? 's' : ''}`} />

      <div style={{ marginTop: 24 }}>
        {factionsLoading ? (
          <ul
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)', listStyle: 'none', padding: 0, margin: 0 }}
            aria-label="Facties laden..."
            aria-live="polite"
          >
            <EntityCardSkeleton count={3} />
          </ul>
        ) : (
          <>
            {(!factions || factions.length === 0) && (
              <EmptyState
                title="Nog geen facties"
                description="Breng de eerste organisatie tot leven. Gildes, adellijke huizen, criminele netwerken — de politieke laag van je wereld begint hier."
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {factions?.map((faction) => (
                <FactionCard key={faction.id} faction={faction} />
              ))}
              <ForgeFactionCard onClick={handleCreate} loading={createFaction.isPending} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
