import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Item } from '@/types/item.types'

export function useCampaignItems(campaignId: string | undefined) {
  return useQuery<Item[]>({
    queryKey: queryKeys.items.byCampaign(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('campaign_id', campaignId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Item[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  })
}
