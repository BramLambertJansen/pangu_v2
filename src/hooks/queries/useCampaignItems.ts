import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Item, ItemType, ItemRarity, ItemStatBonuses } from '@/types/item.types'

export function useCampaignItems(campaignId: string | undefined) {
  return useQuery<Item[]>({
    queryKey: queryKeys.items.byCampaign(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('campaign_id', campaignId!)
        .eq('committed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Item[]
    },
    enabled: !!campaignId,
    staleTime: STALE.list,
  })
}

export function useForgeCampaignItem(campaignId: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .insert({ campaign_id: campaignId, name: 'Nieuw item', item_type: 'misc', rarity: 'common', is_magical: false, quantity: 1 })
        .select()
        .single()
      if (error) throw error
      return data as Item
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.byCampaign(campaignId) })
      navigate(`/items/${newItem.id}/edit`, { state: { isNew: true, campaignId } })
    },
    onError: () => toast.error('Item aanmaken mislukt'),
  })
}

export interface CreateItemInput {
  name: string
  description: string | null
  item_type: ItemType
  rarity: ItemRarity
  is_magical: boolean
  weight: number | null
  properties?: ItemStatBonuses
  image_url?: string | null
}

export function useCreateCampaignItem(campaignId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateItemInput) => {
      const { data, error } = await supabase
        .from('items')
        .insert({
          campaign_id: campaignId,
          name: input.name,
          description: input.description,
          item_type: input.item_type,
          rarity: input.rarity,
          is_magical: input.is_magical,
          weight: input.weight,
          quantity: 1,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          properties: (input.properties ?? {}) as any,
          image_url: input.image_url ?? null,
          committed: true,
        })
        .select()
        .single()
      if (error) throw error
      return data as Item
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.byCampaign(campaignId) })
    },
  })
}
