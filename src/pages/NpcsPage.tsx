import { useParams, useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { NpcCard, ForgeNpcCard } from '@/components/npc/NpcCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import { useCampaign } from '@/hooks/queries/useCampaign'
import { useCampaignNpcs, useCreateCampaignNpc } from '@/hooks/queries/useCampaignNpcs'
import { useDraftGC } from '@/hooks/useDraftGC'

export default function NpcsPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId)
  const { data: npcs, isLoading: npcsLoading } = useCampaignNpcs(campaignId)
  const createNpc = useCreateCampaignNpc(campaignId!)

  useDraftGC('npcs', 'campaign_id', campaignId)

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
        <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
        </Button>
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
          { label: 'NPCs' },
        ]} />
      </div>

      {/* Page header */}
      <header style={{ marginBottom: 32 }}>
        <p className="pangu-eyebrow">Kroniek — {campaign.name}</p>
        <h1 className="pangu-display-xl">NPCs</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Beheer de personages van deze kroniek.
        </p>
      </header>

      <WorldDetailDivider label={`${npcs?.length ?? 0} personage${npcs?.length !== 1 ? 's' : ''}`} />

      {/* NPC grid */}
      <div style={{ marginTop: 24 }}>
        {npcsLoading ? (
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)', listStyle: 'none', padding: 0, margin: 0 }} aria-label="NPCs laden..." aria-live="polite">
            <EntityCardSkeleton count={3} />
          </ul>
        ) : (
          <>
            {(!npcs || npcs.length === 0) && (
              <EmptyState
                title="Nog geen personages"
                description="Breng de eerste NPC tot leven. Elk verhaal heeft zijn held en zijn schurk."
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {npcs?.map((npc) => (
                <NpcCard key={npc.id} npc={npc} />
              ))}
              <ForgeNpcCard onClick={() => createNpc.mutate()} loading={createNpc.isPending} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
