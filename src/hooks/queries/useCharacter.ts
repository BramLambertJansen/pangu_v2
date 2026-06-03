import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Character, SpellSlots, ClassResources } from '@/types/character.types'

export function useCharacter(id: string | undefined) {
  return useQuery<Character>({
    queryKey: queryKeys.characters.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as Character
    },
    enabled: !!id,
    staleTime: STALE.detail,
  })
}

export function useSaveCharacter(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      form,
      joinCampaignId,
      userId,
    }: {
      form: Partial<Character>
      joinCampaignId?: string | null
      userId?: string
    }) => {
      const { error } = await supabase
        .from('characters')
        .update({
          name: form.name,
          subtitle: form.subtitle ?? null,
          character_class: form.character_class ?? null,
          character_subclass: form.character_subclass ?? null,
          character_race: form.character_race ?? null,
          campaign_id: form.campaign_id ?? null,
          level: form.level,
          xp: form.xp,
          xp_next: form.xp_next,
          hp_current: form.hp_current,
          hp_max: form.hp_max,
          armor_class: form.armor_class,
          speed: form.speed,
          initiative: form.initiative,
          proficiency_bonus: form.proficiency_bonus,
          stat_str: form.stat_str,
          stat_dex: form.stat_dex,
          stat_con: form.stat_con,
          stat_int: form.stat_int,
          stat_wis: form.stat_wis,
          stat_cha: form.stat_cha,
          gold: form.gold,
          silver: form.silver,
          copper: form.copper,
          description: form.description ?? null,
          notes: form.notes ?? null,
          status: form.status,
          proficient_skills: form.proficient_skills ?? [],
          saving_throw_proficiencies: form.saving_throw_proficiencies ?? [],
          expertise_skills:           form.expertise_skills ?? [],
          languages:                  form.languages ?? [],
          tool_proficiencies:         form.tool_proficiencies ?? [],
          weapon_proficiencies:       form.weapon_proficiencies ?? [],
          armor_proficiencies:        form.armor_proficiencies ?? [],
          inspiration:                form.inspiration ?? false,
          hit_die:                    form.hit_die ?? 'd8',
          hit_dice_current:           form.hit_dice_current ?? 1,
          death_save_successes:       form.death_save_successes ?? 0,
          death_save_failures:        form.death_save_failures ?? 0,
          exhaustion:                 form.exhaustion ?? 0,
          alignment:                  form.alignment ?? null,
          temp_hp:                    form.temp_hp ?? 0,
          spellcasting_ability:       form.spellcasting_ability ?? null,
          spell_slots:                (form.spell_slots ?? {}) as Record<string, unknown>,
          concentrating:              form.concentrating ?? false,
          concentration_spell:        form.concentration_spell ?? null,
          feats:                      form.feats ?? [],
          weapon_masteries:           form.weapon_masteries ?? [],
          active_conditions:          form.active_conditions ?? [],
          class_resources:            (form.class_resources ?? {}) as Record<string, unknown>,
          platinum:                   form.platinum ?? 0,
          electrum:                   form.electrum ?? 0,
          fly_speed:                  form.fly_speed ?? 0,
          swim_speed:                 form.swim_speed ?? 0,
          climb_speed:                form.climb_speed ?? 0,
          burrow_speed:               form.burrow_speed ?? 0,
          darkvision:                 form.darkvision ?? 0,
          special_senses:             form.special_senses ?? null,
          age:                        form.age ?? null,
          height:                     form.height ?? null,
          weight:                     form.weight ?? null,
          appearance:                 form.appearance ?? null,
          personality_traits:         form.personality_traits ?? null,
          ideals:                     form.ideals ?? null,
          bonds:                      form.bonds ?? null,
          flaws:                      form.flaws ?? null,
          portrait_url:               form.portrait_url ?? null,
          portrait_position:          form.portrait_position ?? 'center',
          committed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error

      if (joinCampaignId && userId) {
        const { error: memberError } = await supabase
          .from('campaign_members')
          .insert({ campaign_id: joinCampaignId, user_id: userId })
        // 23505 = already a member, safe to ignore
        if (memberError && memberError.code !== '23505') throw memberError
      }

      return { joinCampaignId }
    },
    onSuccess: ({ joinCampaignId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id) })
      queryClient.invalidateQueries({ queryKey: ['characters', 'campaign'] })
      if (joinCampaignId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.members(joinCampaignId) })
      }
    },
    onError: () => toast.error('Opslaan mislukt'),
  })
}

export function useDeleteCharacter(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('characters').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.characters.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
    },
    onError: () => toast.error('Verwijderen mislukt'),
  })
}

export function useUpdateCharacterHp(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (newHp: number) => {
      const { error } = await supabase
        .from('characters')
        .update({ hp_current: newHp, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
    },
    onError: () => toast.error('HP bijwerken mislukt'),
  })
}

export function useToggleCharacterInspiration(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { error } = await supabase
        .from('characters')
        .update({ inspiration: value, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
    },
    onError: () => toast.error('Inspiratie bijwerken mislukt'),
  })
}

export function useUpdateCharacterDeathSaves(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ successes, failures }: { successes: number; failures: number }) => {
      const { error } = await supabase
        .from('characters')
        .update({ death_save_successes: successes, death_save_failures: failures, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id) })
    },
    onError: () => toast.error('Stervensgooien bijwerken mislukt'),
  })
}

export function useUpdateCharacterSpellSlot(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      level,
      current,
      currentSlots,
    }: {
      level: string
      current: number
      currentSlots: SpellSlots
    }) => {
      const slots = { ...currentSlots } as SpellSlots
      const key = level as keyof SpellSlots
      if (slots[key]) {
        slots[key] = { ...slots[key]!, current: Math.max(0, Math.min(current, slots[key]!.max)) }
      }
      const { error } = await supabase
        .from('characters')
        .update({ spell_slots: slots as Record<string, unknown>, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id) })
    },
    onError: () => toast.error('Spreukslots bijwerken mislukt'),
  })
}

export function useToggleCharacterCondition(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      condition,
      currentConditions,
    }: {
      condition: string
      currentConditions: string[]
    }) => {
      const updated = currentConditions.includes(condition)
        ? currentConditions.filter(c => c !== condition)
        : [...currentConditions, condition]
      const { error } = await supabase
        .from('characters')
        .update({ active_conditions: updated, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id) })
    },
    onError: () => toast.error('Conditie bijwerken mislukt'),
  })
}

export function useUpdateCharacterClassResource(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      name,
      current,
      currentResources,
    }: {
      name: string
      current: number
      currentResources: ClassResources
    }) => {
      const resources = { ...currentResources } as ClassResources
      if (resources[name]) {
        resources[name] = { ...resources[name], current: Math.max(0, Math.min(current, resources[name].max)) }
      }
      const { error } = await supabase
        .from('characters')
        .update({ class_resources: resources as Record<string, unknown>, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id) })
    },
    onError: () => toast.error('Resource bijwerken mislukt'),
  })
}

export function useUpdateCharacterTempHp(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (value: number) => {
      const { error } = await supabase
        .from('characters')
        .update({ temp_hp: Math.max(0, value), updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
    },
    onError: () => toast.error('Tijdelijke HP bijwerken mislukt'),
  })
}

export function useCharacterLongRest(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (character: Character) => {
      const restoredSlots = { ...(character.spell_slots ?? {}) } as SpellSlots
      for (const level of Object.keys(restoredSlots)) {
        const key = level as keyof SpellSlots
        if (restoredSlots[key]) {
          restoredSlots[key] = { ...restoredSlots[key]!, current: restoredSlots[key]!.max }
        }
      }
      const { error } = await supabase
        .from('characters')
        .update({
          hp_current: character.hp_max ?? 0,
          temp_hp: 0,
          spell_slots: restoredSlots as Record<string, unknown>,
          death_save_successes: 0,
          death_save_failures: 0,
          hit_dice_current: character.level,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
      toast.success('Lange rust genomen — HP en spreukslots hersteld')
    },
    onError: () => toast.error('Lange rust mislukt'),
  })
}

export function useReturnItemToDm(characterId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('items')
        .update({ character_id: null, equipped_slot: null, updated_at: new Date().toISOString() })
        .eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.items(characterId) })
      queryClient.invalidateQueries({ queryKey: ['items'] })
      toast.success('Item teruggegeven aan de DM')
    },
    onError: () => toast.error('Teruggeven mislukt'),
  })
}
