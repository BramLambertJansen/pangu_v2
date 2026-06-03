import { STALE } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'

export interface UserAISettings {
  byok_keys: Record<string, string>
  preferred_provider: string | null
  preferred_model: string | null
}

export function useUserAISettings(userId: string | undefined) {
  return useQuery<UserAISettings | null>({
    queryKey: queryKeys.userAiSettings(userId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_ai_settings')
        .select('byok_keys, preferred_provider, preferred_model')
        .eq('user_id', userId!)
        .maybeSingle()
      if (error) throw error
      return data as UserAISettings | null
    },
    enabled: !!userId,
    staleTime: STALE.slow,
  })
}

export function useSetByokKey(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      provider,
      key,
      currentKeys,
    }: {
      provider: string
      key: string | null
      currentKeys: Record<string, string>
    }) => {
      if (!userId) throw new Error('no_user')
      const newKeys = { ...currentKeys }
      if (key === null) {
        delete newKeys[provider]
      } else {
        newKeys[provider] = key
      }
      const { error } = await supabase
        .from('user_ai_settings')
        .upsert({ user_id: userId, byok_keys: newKeys }, { onConflict: 'user_id' })
      if (error) throw error
      return { provider, key, newKeys }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userAiSettings(userId!) })
    },
  })
}
