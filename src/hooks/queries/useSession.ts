import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import type { Session } from '@/types/session.types'

export function useSession(id: string | undefined) {
  return useQuery<Session>({
    queryKey: queryKeys.campaigns.sessionDetail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Session
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}
