import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Item, EquipmentSlot } from '@/types/item.types'

export function useCharacterItems(characterId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery<Item[]>({
    queryKey: queryKeys.characters.items(characterId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('character_id', characterId ?? '')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Item[]
    },
    enabled: !!characterId,
    staleTime: 1000 * 30,
  })

  const equipItem = useMutation({
    mutationFn: async ({ itemId, slot }: { itemId: string; slot: EquipmentSlot }) => {
      // First unequip any item already in this slot for this character.
      const { error: unequipError } = await supabase
        .from('items')
        .update({ equipped_slot: null, updated_at: new Date().toISOString() })
        .eq('character_id', characterId ?? '')
        .eq('equipped_slot', slot)
      if (unequipError) throw unequipError

      // Then equip the selected item.
      const { error } = await supabase
        .from('items')
        .update({ equipped_slot: slot, updated_at: new Date().toISOString() })
        .eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.items(characterId ?? '') })
    },
  })

  const unequipItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('items')
        .update({ equipped_slot: null, updated_at: new Date().toISOString() })
        .eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.items(characterId ?? '') })
    },
  })

  return { ...query, equipItem, unequipItem }
}
