import { useParams, useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { LocationCard, ForgeLocationCard } from '@/components/location/LocationCard'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import { useCampaign } from '@/hooks/queries/useCampaign'
import { useCampaignLocations, useCreateCampaignLocation } from '@/hooks/queries/useCampaignLocations'
import { useDraftGC } from '@/hooks/useDraftGC'

export default function LocationsPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId)
  const { data: locations, isLoading: locationsLoading } = useCampaignLocations(campaignId)
  const createLocation = useCreateCampaignLocation(campaignId!)

  useDraftGC('locations', 'campaign_id', campaignId)

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
          { label: 'Locaties' },
        ]} />
      </div>

      {/* Page header */}
      <header style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p className="pangu-eyebrow">Kroniek — {campaign.name}</p>
          <h1 className="pangu-display-xl">Locaties</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Beheer de locaties van deze kroniek.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/campaigns/${campaignId}/atlas`)}
          style={{ flexShrink: 0, marginTop: 4 }}
        >
          🗺 Atlas bekijken
        </Button>
      </header>

      <OrnateDivider label={`${locations?.length ?? 0} locatie${locations?.length !== 1 ? 's' : ''}`} />

      {/* Location grid */}
      <div style={{ marginTop: 24 }}>
        {locationsLoading ? (
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)', listStyle: 'none', padding: 0, margin: 0 }} aria-label="Locaties laden..." aria-live="polite">
            <EntityCardSkeleton count={3} />
          </ul>
        ) : (
          <>
            {(!locations || locations.length === 0) && (
              <EmptyState
                title="Nog geen locaties"
                description="Breng de eerste plek in kaart. Elk verhaal speelt zich ergens af."
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {locations?.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
              <ForgeLocationCard onClick={() => createLocation.mutate()} loading={createLocation.isPending} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
