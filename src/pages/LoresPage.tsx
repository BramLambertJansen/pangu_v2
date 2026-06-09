import { useParams, useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { LoreCard, ForgeLoreCard } from '@/components/lore/LoreCard'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import { useCampaign } from '@/hooks/queries/useCampaign'
import { useCampaignLore, useCreateCampaignLore } from '@/hooks/queries/useCampaignLore'
import { useDraftGC } from '@/hooks/useDraftGC'

export default function LoresPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId)
  const { data: loreItems, isLoading: loreLoading } = useCampaignLore(campaignId)
  const createLore = useCreateCampaignLore(campaignId!)

  useDraftGC('lore', 'campaign_id', campaignId)

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
        <Breadcrumbs compact items={[
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

      <OrnateDivider label={`${loreItems?.length ?? 0} lore-item${loreItems?.length !== 1 ? 's' : ''}`} />

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
              <ForgeLoreCard onClick={() => createLore.mutate()} loading={createLore.isPending} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
