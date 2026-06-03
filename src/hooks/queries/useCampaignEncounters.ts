import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import type { Encounter } from '@/types/encounter.types'

export function useCampaignEncounters(campaignId: string | undefined) {
  return useQuery<Encounter[]>({
    queryKey: queryKeys.campaigns.encounters(campaignId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encounters')
        .select('*')
        .eq('campaign_id', campaignId ?? '')
        .eq('committed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Encounter[]
    },
    enabled: !!campaignId,
    staleTime: STALE.list,
  })
}

export function useCreateCampaignEncounter(campaignId: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('encounters')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          name: 'Nieuw gevecht',
          status: 'draft',
        })
        .select()
        .single()
      if (error) throw error
      return data as Encounter
    },
    onSuccess: (newEncounter) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.encounters(campaignId) })
      navigate(`/encounters/${newEncounter.id}/edit`, { state: { isNew: true, campaignId } })
    },
    onError: () => toast.error('Gevecht aanmaken mislukt'),
  })
}
