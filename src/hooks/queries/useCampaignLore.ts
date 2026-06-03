import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import type { Lore } from '@/types/lore.types'

export function useCampaignLore(campaignId: string | undefined) {
  return useQuery<Lore[]>({
    queryKey: queryKeys.lore.byCampaign(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lore')
        .select('*')
        .eq('campaign_id', campaignId!)
        .eq('committed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Lore[]
    },
    enabled: !!campaignId,
    staleTime: STALE.list,
  })
}

export function useCreateCampaignLore(campaignId: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('lore')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          name: 'Nieuw lore-item',
          status: 'draft',
        })
        .select()
        .single()
      if (error) throw error
      return data as Lore
    },
    onSuccess: (newLore) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lore.byCampaign(campaignId) })
      navigate(`/lore/${newLore.id}/edit`, { state: { isNew: true, campaignId } })
    },
    onError: () => toast.error('Lore aanmaken mislukt'),
  })
}
