import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import type { Spell } from '@/types/spell.types'

export function useSpells() {
  const user = useAuthStore(s => s.user)
  return useQuery<Spell[]>({
    queryKey: queryKeys.spells.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spells')
        .select('*')
        .order('level', { ascending: true })
        .order('name', { ascending: true })
      if (error) throw error
      return data as Spell[]
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  })
}

export function useDeleteSpell() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('spells').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spells.all })
      // DB cascade removes character_spells rows — invalidate all character spell caches
      queryClient.invalidateQueries({ queryKey: ['characters'] })
      toast.success('Spreuk verwijderd')
    },
    onError: () => toast.error('Spreuk verwijderen mislukt'),
  })
}
