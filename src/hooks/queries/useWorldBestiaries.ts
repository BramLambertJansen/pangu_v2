import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Bestiary } from '@/types/bestiary.types'

export function useWorldBestiaries(worldId: string | undefined) {
  return useQuery<Bestiary[]>({
    queryKey: queryKeys.worlds.bestiaries(worldId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bestiaries')
        .select('*')
        .eq('world_id', worldId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Bestiary[]
    },
    enabled: !!worldId,
    staleTime: 1000 * 30,
  })
}
