import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Location } from '@/types/location.types'

export function useCampaignLocations(campaignId: string | undefined) {
  return useQuery<Location[]>({
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
}
