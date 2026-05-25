import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Item } from '@/types/item.types'

export function useCharacterItems(characterId: string | undefined) {
  return useQuery<Item[]>({
    queryKey: queryKeys.characters.items(characterId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('character_id', characterId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Item[]
    },
    enabled: !!characterId,
    staleTime: 1000 * 30,
  })
}
