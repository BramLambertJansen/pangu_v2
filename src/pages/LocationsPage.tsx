import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Spinner } from '@/components/ui/Spinner'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { LocationCard, ForgeLocationCard } from '@/components/location/LocationCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import type { Location } from '@/types/location.types'
import { useAuthStore } from '@/stores/auth.store'
import { useCampaign } from '@/hooks/queries/useCampaign'
import { useCampaignLocations } from '@/hooks/queries/useCampaignLocations'

export default function LocationsPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  const [creatingLocation, setCreatingLocation] = useState(false)

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId)
  const { data: locations, isLoading: locationsLoading } = useCampaignLocations(campaignId)

  const createLocation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('locations')
        .insert({
          campaign_id: campaignId!,
          user_id: user.id,
          name: 'Nieuwe locatie',
          status: 'draft',
        })
        .select()
        .single()
      if (error) throw error
      return data as Location
    },
    onSuccess: (newLocation) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.locations(campaignId!) })
      navigate(`/locations/${newLocation.id}/edit`, {
        state: { isNew: true, campaignId },
      })
    },
    onError: () => {
      toast.error('Locatie aanmaken mislukt')
      setCreatingLocation(false)
    },
  })

  function handleCreateLocation() {
    setCreatingLocation(true)
    createLocation.mutate()
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
          { label: 'Locaties' },
        ]} />
      </div>

      {/* Page header */}
      <header style={{ marginBottom: 32 }}>
        <p className="pangu-eyebrow">Kroniek — {campaign.name}</p>
        <h1 className="pangu-display-xl">Locaties</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Beheer de locaties van deze kroniek.
        </p>
      </header>

      <WorldDetailDivider label={`${locations?.length ?? 0} locatie${locations?.length !== 1 ? 's' : ''}`} />

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
              <ForgeLocationCard onClick={handleCreateLocation} loading={creatingLocation} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
