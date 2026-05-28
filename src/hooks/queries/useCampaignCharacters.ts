import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Character } from '@/types/character.types'

export function useCampaignCharacters(campaignId: string | undefined) {
  return useQuery<Character[]>({
    queryKey: queryKeys.characters.byCampaign(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('campaign_id', campaignId!)
        .eq('committed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as Character[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  })
}
