import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Location } from '@/types/location.types'

type LocationWithCampaign = Location & {
  campaigns: { id: string; name: string; world_id: string; worlds: { id: string; name: string } | null } | null
}

export function useLocation(id: string | undefined) {
  return useQuery<Location>({
    queryKey: queryKeys.locations.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Location
    },
    enabled: !!id,
    staleTime: STALE.detail,
  })
}

export function useLocationFull(id: string | undefined) {
  return useQuery<LocationWithCampaign>({
    queryKey: queryKeys.locations.detailFull(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*, campaigns(id, name, world_id, worlds(id, name))')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as LocationWithCampaign
    },
    enabled: !!id,
    staleTime: STALE.detail,
  })
}

export function useSaveLocation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (form: Partial<Location>) => {
      const { error } = await supabase
        .from('locations')
        .update({
          name: form.name,
          subtitle: form.subtitle,
          description: form.description,
          notes: form.notes,
          status: form.status,
          location_type: form.location_type ?? null,
          map_x: form.map_x ?? null,
          map_y: form.map_y ?? null,
          region: form.region ?? null,
          climate: form.climate ?? null,
          committed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
      return form
    },
    onSuccess: (form) => {
      if (form.campaign_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.locations.byCampaign(form.campaign_id) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.detail(id) })
    },
    onError: () => toast.error('Opslaan mislukt'),
  })
}

export function useDeleteLocation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_vars: { campaignId?: string }) => {
      const { error } = await supabase.from('locations').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.removeQueries({ queryKey: queryKeys.locations.detail(id) })
      if (campaignId) queryClient.invalidateQueries({ queryKey: queryKeys.locations.byCampaign(campaignId) })
    },
    onError: () => toast.error('Verwijderen mislukt'),
  })
}
