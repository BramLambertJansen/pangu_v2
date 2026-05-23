import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Encounter } from '@/types/encounter.types'

export function useCampaignEncounters(campaignId: string | undefined) {
  return useQuery<Encounter[]>({
    queryKey: queryKeys.campaigns.encounters(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encounters')
        .select('*')
        .eq('campaign_id', campaignId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Encounter[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  })
}
