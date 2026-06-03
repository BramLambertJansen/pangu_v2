import { STALE } from '@/lib/queryClient'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Bestiary } from '@/types/bestiary.types'

export interface EncounterMonsterFull {
  id: string
  encounter_id: string
  bestiary_id: string
  count: number
  bestiary: Bestiary | null
}

export function useEncounterMonsters(encounterId: string | undefined) {
  return useQuery<EncounterMonsterFull[]>({
    queryKey: queryKeys.campaigns.encounterMonstersFull(encounterId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encounter_monsters')
        .select('*, bestiary:bestiaries(*)')
        .eq('encounter_id', encounterId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as EncounterMonsterFull[]
    },
    enabled: !!encounterId,
    staleTime: STALE.detail,
  })
}
