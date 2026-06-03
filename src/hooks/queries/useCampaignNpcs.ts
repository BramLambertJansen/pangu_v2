import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
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

export function useCreateCampaignNpc(campaignId: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('npcs')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          name: 'Nieuwe NPC',
          status: 'draft',
        })
        .select()
        .single()
      if (error) throw error
      return data as Npc
    },
    onSuccess: (newNpc) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.npcs(campaignId) })
      navigate(`/npcs/${newNpc.id}/edit`, { state: { isNew: true, campaignId } })
    },
    onError: () => toast.error('NPC aanmaken mislukt'),
  })
}
