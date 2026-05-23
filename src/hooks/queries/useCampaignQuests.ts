import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Quest } from '@/types/quest.types'

export function useCampaignQuests(campaignId: string | undefined) {
  return useQuery<Quest[]>({
    queryKey: queryKeys.campaigns.quests(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('campaign_id', campaignId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Quest[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  })
}
