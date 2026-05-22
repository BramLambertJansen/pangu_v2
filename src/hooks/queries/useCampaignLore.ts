import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Lore } from '@/types/lore.types'

export function useCampaignLore(campaignId: string | undefined) {
  return useQuery<Lore[]>({
    queryKey: queryKeys.campaigns.lore(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lore')
        .select('*')
        .eq('campaign_id', campaignId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Lore[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  })
}
