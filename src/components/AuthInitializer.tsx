import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { queryClient } from '@/lib/queryClient'

async function syncProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (data) useAuthStore.getState().setProfile(data)
}

/**
 * Mounts once at app root; keeps Zustand auth state in sync with
 * Supabase session changes (tab restore, token refresh, sign-out).
 * Renders nothing — pure side-effect.
 */
export function AuthInitializer() {
  const setUser = useAuthStore(s => s.setUser)
  const setProfile = useAuthStore(s => s.setProfile)
  const signOut = useAuthStore(s => s.signOut)

  useEffect(() => {
    // Hydrate on mount from existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) syncProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          signOut()
          queryClient.clear()
          return
        }
        setUser(session?.user ?? null)
        if (session?.user) syncProfile(session.user.id)
        if (event === 'USER_UPDATED') {
          setProfile(null) // force re-fetch on next profile access
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [setUser, setProfile, signOut])

  return null
}
