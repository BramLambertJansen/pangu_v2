import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Npc } from '@/types/npc.types'

export function useCampaignNpcs(campaignId: string | undefined) {
  return useQuery<Npc[]>({
    queryKey: queryKeys.campaigns.npcs(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('npcs')
        .select('*')
        .eq('campaign_id', campaignId!)
        .eq('committed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Npc[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  })
}
