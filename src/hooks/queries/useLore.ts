import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Lore } from '@/types/lore.types'

type LoreWithCampaign = Lore & {
  campaigns: { id: string; name: string; world_id: string; worlds: { id: string; name: string } | null } | null
}

export function useLore(id: string | undefined) {
  return useQuery<Lore>({
    queryKey: queryKeys.lore.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lore')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Lore
    },
    enabled: !!id,
    staleTime: STALE.detail,
  })
}

export function useLoreFull(id: string | undefined) {
  return useQuery<LoreWithCampaign>({
    queryKey: queryKeys.lore.detailFull(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lore')
        .select('*, campaigns(id, name, world_id, worlds(id, name))')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as LoreWithCampaign
    },
    enabled: !!id,
    staleTime: STALE.detail,
  })
}

export function useSaveLore(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (form: Partial<Lore>) => {
      const { error } = await supabase
        .from('lore')
        .update({
          name: form.name,
          subtitle: form.subtitle,
          description: form.description,
          notes: form.notes,
          status: form.status,
          lore_category: form.lore_category ?? null,
          committed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
      return form
    },
    onSuccess: (form) => {
      if (form.campaign_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.lore.byCampaign(form.campaign_id) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.lore.detail(id) })
    },
    onError: () => toast.error('Opslaan mislukt'),
  })
}

export function useDeleteLore(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_vars: { campaignId?: string }) => {
      const { error } = await supabase.from('lore').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.removeQueries({ queryKey: queryKeys.lore.detail(id) })
      if (campaignId) queryClient.invalidateQueries({ queryKey: queryKeys.lore.byCampaign(campaignId) })
    },
    onError: () => toast.error('Verwijderen mislukt'),
  })
}
