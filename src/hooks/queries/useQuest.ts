import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Quest } from '@/types/quest.types'

type QuestWithCampaign = Quest & {
  campaigns: { id: string; name: string; world_id: string; worlds: { id: string; name: string } | null } | null
}

export function useQuest(id: string | undefined) {
  return useQuery<Quest>({
    queryKey: queryKeys.campaigns.questDetail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Quest
    },
    enabled: !!id,
    staleTime: STALE.detail,
  })
}

export function useQuestFull(id: string | undefined) {
  return useQuery<QuestWithCampaign>({
    queryKey: queryKeys.campaigns.questDetailFull(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select('*, campaigns(id, name, world_id, worlds(id, name))')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as QuestWithCampaign
    },
    enabled: !!id,
    staleTime: STALE.detail,
  })
}

export function useSaveQuest(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (form: Partial<Quest>) => {
      const { error } = await supabase
        .from('quests')
        .update({
          name: form.name,
          subtitle: form.subtitle,
          description: form.description,
          notes: form.notes,
          status: form.status,
          quest_type: form.quest_type ?? null,
          difficulty: form.difficulty ?? null,
          reward: form.reward ?? null,
          committed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
      return form
    },
    onSuccess: (form) => {
      if (form.campaign_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.quests(form.campaign_id) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.questDetail(id) })
    },
    onError: () => toast.error('Opslaan mislukt'),
  })
}

export function useDeleteQuest(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_vars: { campaignId?: string }) => {
      const { error } = await supabase.from('quests').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.removeQueries({ queryKey: queryKeys.campaigns.questDetail(id) })
      if (campaignId) queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.quests(campaignId) })
    },
    onError: () => toast.error('Verwijderen mislukt'),
  })
}
