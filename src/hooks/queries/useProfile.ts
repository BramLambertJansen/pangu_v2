import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import type { Profile } from '@/types/database.types'

export function useUpdateProfile() {
  const profile = useAuthStore(s => s.profile)
  const setProfile = useAuthStore(s => s.setProfile)
  return useMutation({
    mutationFn: async ({ display_name, pronouns, bio }: { display_name: string; pronouns: string; bio: string }) => {
      if (!profile) throw new Error('no_profile')
      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: display_name.trim(),
          pronouns: pronouns.trim() || null,
          bio: bio.trim() || null,
        })
        .eq('id', profile.id)
        .select()
        .single()
      if (error) throw error
      return data as Profile
    },
    onSuccess: (data) => {
      setProfile({ ...profile!, ...data } as Profile)
      toast.success('Profiel opgeslagen')
    },
    onError: () => toast.error('Opslaan mislukt'),
  })
}
