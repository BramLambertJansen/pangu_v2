import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { searchMonsters, searchMagicItems, mapMonsterToBestiary, mapMagicItemToItem } from '@/lib/open5e'
import { useAuthStore } from '@/stores/auth.store'
import type { Open5eMonster, Open5eMagicItem } from '@/types/open5e.types'
import type { Bestiary } from '@/types/bestiary.types'
import type { Item } from '@/types/item.types'

export function useSrdMonsterSearch(query: string) {
  return useQuery<Open5eMonster[]>({
    queryKey: queryKeys.srd.monsters(query),
    queryFn: () => searchMonsters(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 60,
  })
}

export function useSrdItemSearch(query: string) {
  return useQuery<Open5eMagicItem[]>({
    queryKey: queryKeys.srd.items(query),
    queryFn: () => searchMagicItems(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 60,
  })
}

export function useImportMonster(worldId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async (monster: Open5eMonster) => {
      if (!user) throw new Error('Niet ingelogd')

      const { data: existing } = await supabase
        .from('bestiaries')
        .select('id')
        .eq('world_id', worldId)
        .eq('source_slug', monster.slug)
        .maybeSingle()
      if (existing) throw new Error('Dit wezen is al geïmporteerd in dit bestiarium.')

      const { data, error } = await supabase
        .from('bestiaries')
        .insert(mapMonsterToBestiary(monster, worldId, user.id))
        .select()
        .single()
      if (error) throw error
      return data as Bestiary
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.bestiaries(worldId) })
      toast.success(`${data.name} geïmporteerd`)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}

export function useImportMagicItem(campaignId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (magicItem: Open5eMagicItem) => {
      const { data: existing } = await supabase
        .from('items')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('source_slug', magicItem.slug)
        .maybeSingle()
      if (existing) throw new Error('Dit item is al geïmporteerd in deze kroniek.')

      const { data, error } = await supabase
        .from('items')
        .insert(mapMagicItemToItem(magicItem, campaignId))
        .select()
        .single()
      if (error) throw error
      return data as Item
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.byCampaign(campaignId) })
      toast.success(`${data.name} geïmporteerd`)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}
