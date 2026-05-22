import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Campaign } from '@/types/campaign.types'

export type CampaignWithWorld = Campaign & { worlds: { name: string } | null }

export function useCampaign(id: string | undefined) {
  return useQuery<Campaign>({
    queryKey: queryKeys.campaigns.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Campaign
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

export function useCampaignWithWorld(id: string | undefined) {
  return useQuery<CampaignWithWorld>({
    queryKey: queryKeys.campaigns.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, worlds(name)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as CampaignWithWorld
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}
