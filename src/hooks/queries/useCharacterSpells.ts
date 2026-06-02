import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Spell } from '@/types/spell.types'

export interface CharacterSpellEntry {
  id: string
  character_id: string
  spell_id: string
  prepared: boolean
  created_at: string
  spell: Spell
}

export function useCharacterSpells(characterId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.characters.spells(characterId ?? ''),
    enabled: !!characterId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('character_spells')
        .select('*, spell:spells(*)')
        .eq('character_id', characterId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as CharacterSpellEntry[]
    },
  })
}

export function useAddCharacterSpell(characterId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (spellId: string) => {
      const { error } = await supabase
        .from('character_spells')
        .insert({ character_id: characterId, spell_id: spellId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.spells(characterId) })
      toast.success('Spreuk toegevoegd')
    },
    onError: () => toast.error('Spreuk toevoegen mislukt'),
  })
}

export function useRemoveCharacterSpell(characterId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('character_spells')
        .delete()
        .eq('id', entryId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.spells(characterId) })
      toast.success('Spreuk verwijderd')
    },
    onError: () => toast.error('Spreuk verwijderen mislukt'),
  })
}

export function useToggleSpellPrepared(characterId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ entryId, prepared }: { entryId: string; prepared: boolean }) => {
      const { error } = await supabase
        .from('character_spells')
        .update({ prepared })
        .eq('id', entryId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.spells(characterId) })
    },
    onError: () => toast.error('Spreuk bijwerken mislukt'),
  })
}
