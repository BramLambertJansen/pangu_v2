import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import { buildCharacterInsert } from '@/utils/characterWizard'
import type { Character } from '@/types/character.types'
import type { WizardDraft } from '@/types/character_wizard.types'

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
    mutationFn: async (campaignId?: string) => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('characters')
        .insert({
          user_id: user.id,
          name: 'Nieuw karakter',
          status: 'active',
          campaign_id: campaignId ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as unknown as Character
    },
    onSuccess: (newCharacter) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
      if (newCharacter.campaign_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.characters.byCampaign(newCharacter.campaign_id) })
      }
      navigate(`/characters/${newCharacter.id}/edit`, { state: { isNew: true } })
    },
    onError: () => toast.error('Karakter aanmaken mislukt'),
  })
}

/**
 * Rondt de karakter-wizard af: één committed insert + gekozen spreuken als
 * character_spells. Anders dan het forge-patroon bestaat er vóór dit moment
 * geen DB-rij.
 */
export function useForgeCharacterFromWizard() {
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async (draft: WizardDraft) => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('characters')
        .insert(buildCharacterInsert(draft, user.id))
        .select()
        .single()
      if (error) throw error
      const character = data as unknown as Character

      const spellIds = draft.spellsDeferred ? [] : [...draft.cantripIds, ...draft.spellIds]
      if (spellIds.length > 0) {
        const { error: spellsError } = await supabase
          .from('character_spells')
          .insert(spellIds.map(spellId => ({ character_id: character.id, spell_id: spellId, prepared: true })))
        // karakter bestaat al — spreuken zijn via de detailpagina alsnog te koppelen
        if (spellsError) toast.error('Spreuken koppelen mislukt — voeg ze toe via de detailpagina')
      }

      return character
    },
    onSuccess: (character) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.spells(character.id) })
      if (character.campaign_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.characters.byCampaign(character.campaign_id) })
      }
      toast.success('Karakter gesmeed')
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
