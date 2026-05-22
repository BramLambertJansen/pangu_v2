import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Spinner } from '@/components/ui/Spinner'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { LocationCard, ForgeLocationCard } from '@/components/location/LocationCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import type { Campaign } from '@/types/campaign.types'
import type { Location } from '@/types/location.types'
import { useAuthStore } from '@/stores/auth.store'

export default function LocationsPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [creatingLocation, setCreatingLocation] = useState(false)

  const { data: campaign, isLoading: campaignLoading } = useQuery<Campaign>({
    queryKey: queryKeys.campaigns.detail(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId!)
        .single()
      if (error) throw error
      return data as Campaign
    },
    enabled: !!campaignId,
    staleTime: 1000 * 60,
  })

  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: queryKeys.campaigns.locations(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('campaign_id', campaignId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Location[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  })

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

  const isLoading = campaignLoading || locationsLoading

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Locaties laden...">
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
      <Breadcrumb items={[
        { label: 'Wereld', onClick: () => navigate(`/worlds/${campaign.world_id}`) },
        { label: campaign.name, onClick: () => navigate(`/campaigns/${campaignId}`) },
        { label: 'Locaties' },
      ]} />

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
        {(!locations || locations.length === 0) && (
          <p style={{
            fontSize: 14, color: 'var(--muted)',
            fontStyle: 'italic', marginBottom: 24,
          }}>
            Nog geen locaties. Breng de eerste plek in kaart.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations?.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
          <ForgeLocationCard onClick={handleCreateLocation} loading={creatingLocation} />
        </div>
      </div>
    </div>
  )
}
