import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import type { Location } from '@/types/location.types'

export function useCampaignLocations(campaignId: string | undefined) {
  return useQuery<Location[]>({
    queryKey: queryKeys.campaigns.locations(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('campaign_id', campaignId!)
        .eq('committed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Location[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  })
}

export function useCreateCampaignLocation(campaignId: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('locations')
        .insert({
          campaign_id: campaignId,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.locations(campaignId) })
      navigate(`/locations/${newLocation.id}/edit`, { state: { isNew: true, campaignId } })
    },
    onError: () => toast.error('Locatie aanmaken mislukt'),
  })
}
