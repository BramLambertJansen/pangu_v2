import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Item } from '@/types/item.types'
import type { Json } from '@/types/database.types'

export function useItem(id: string | undefined) {
  return useQuery<Item>({
    queryKey: queryKeys.items.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Item
    },
    enabled: !!id,
    staleTime: STALE.detail,
  })
}

export function useSaveItem(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      form,
      originalCharacterId,
    }: {
      form: Partial<Item>
      originalCharacterId?: string | null
    }) => {
      const characterChanged = (form.character_id ?? null) !== (originalCharacterId ?? null)
      const { error } = await supabase
        .from('items')
        .update({
          name: form.name,
          description: form.description ?? null,
          item_type: form.item_type,
          rarity: form.rarity,
          is_magical: form.is_magical ?? false,
          quantity: form.quantity ?? 1,
          weight: form.weight ?? null,
          character_id: form.character_id ?? null,
          properties: (form.properties ?? {}) as unknown as Json,
          image_url: form.image_url ?? null,
          committed: true,
          updated_at: new Date().toISOString(),
          ...(characterChanged ? { equipped_slot: null } : {}),
        })
        .eq('id', id)
      if (error) throw error
      return form
    },
    onSuccess: (form) => {
      if (form.campaign_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.items.byCampaign(form.campaign_id) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(id) })
      queryClient.invalidateQueries({ queryKey: ['characters'] })
    },
    onError: () => toast.error('Opslaan mislukt'),
  })
}

export function useDeleteItem(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_vars: { campaignId?: string }) => {
      const { error } = await supabase.from('items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.removeQueries({ queryKey: queryKeys.items.detail(id) })
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.items.byCampaign(campaignId) })
        queryClient.invalidateQueries({ queryKey: ['characters'] })
      }
    },
    onError: () => toast.error('Verwijderen mislukt'),
  })
}
