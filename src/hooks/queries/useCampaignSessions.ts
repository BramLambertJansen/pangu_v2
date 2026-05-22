import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Session } from '@/types/session.types'

export function useCampaignSessions(campaignId: string | undefined) {
  return useQuery<Session[]>({
    queryKey: queryKeys.campaigns.sessions(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', campaignId!)
        .order('session_number', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Session[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  })
}
