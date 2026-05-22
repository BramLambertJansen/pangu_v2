import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { World } from '@/types/world.types'

export function useWorld(id: string | undefined) {
  return useQuery<World>({
    queryKey: queryKeys.worlds.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worlds')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as World
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}
