import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
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
        .eq('committed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as Character[]
    },
    enabled: !!user,
    staleTime: STALE.list,
  })
}

export function useCreateCharacter() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('characters')
        .insert({
          user_id: user.id,
          name: 'Nieuw karakter',
          status: 'active',
        })
        .select()
        .single()
      if (error) throw error
      return data as unknown as Character
    },
    onSuccess: (newCharacter) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
      navigate(`/characters/${newCharacter.id}/edit`, { state: { isNew: true } })
    },
    onError: () => toast.error('Karakter aanmaken mislukt'),
  })
}

export function useUnassignedCharacters() {
  const user = useAuthStore(s => s.user)

  return useQuery<Character[]>({
    queryKey: [...queryKeys.characters.all, 'unassigned'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user!.id)
        .eq('committed', true)
        .is('campaign_id', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as Character[]
    },
    enabled: !!user,
    staleTime: STALE.list,
  })
}
