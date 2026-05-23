import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import type { Character } from '@/types/character.types'

export function useCharacters() {
  const user = useAuthStore(s => s.user)

  return useQuery<Character[]>({
    queryKey: queryKeys.characters.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Character[]
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}
