import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import type { Quest } from '@/types/quest.types'

export function useCampaignQuests(campaignId: string | undefined) {
  return useQuery<Quest[]>({
    queryKey: queryKeys.campaigns.quests(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('campaign_id', campaignId!)
        .eq('committed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Quest[]
    },
    enabled: !!campaignId,
    staleTime: STALE.list,
  })
}

export function useCreateCampaignQuest(campaignId: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('quests')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          name: 'Nieuwe quest',
          status: 'draft',
        })
        .select()
        .single()
      if (error) throw error
      return data as Quest
    },
    onSuccess: (newQuest) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.quests(campaignId) })
      navigate(`/quests/${newQuest.id}/edit`, { state: { isNew: true, campaignId } })
    },
    onError: () => toast.error('Quest aanmaken mislukt'),
  })
}
