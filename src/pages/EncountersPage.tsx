import { useParams, useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { EncounterCard, ForgeEncounterCard } from '@/components/encounter/EncounterCard'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import { useCampaign } from '@/hooks/queries/useCampaign'
import { useCampaignEncounters, useCreateCampaignEncounter } from '@/hooks/queries/useCampaignEncounters'
import { useDraftGC } from '@/hooks/useDraftGC'

export default function EncountersPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId)
  const { data: encounters, isLoading: encountersLoading } = useCampaignEncounters(campaignId)
  const createEncounter = useCreateCampaignEncounter(campaignId!)

  useDraftGC('encounters', 'campaign_id', campaignId)

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
          { label: 'Gevechten' },
        ]} />
      </div>

      {/* Page header */}
      <header style={{ marginBottom: 32 }}>
        <p className="pg-eyebrow">Kroniek — {campaign.name}</p>
        <h1 className="pg-display-xl">Gevechten</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Plan en beheer de gevechten van deze kroniek.
        </p>
      </header>

      <OrnateDivider label={`${encounters?.length ?? 0} gevecht${encounters?.length !== 1 ? 'en' : ''}`} />

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
              <ForgeEncounterCard onClick={() => createEncounter.mutate()} loading={createEncounter.isPending} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
