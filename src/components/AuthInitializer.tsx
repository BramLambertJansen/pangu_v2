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

function clearPersistedCache(userId: string) {
  localStorage.removeItem(`rq-cache:${userId}`)
}

/**
 * Mounts once at app root; keeps Zustand auth state in sync with
 * Supabase session changes (tab restore, token refresh, sign-out).
 * Also clears the persisted query cache on sign-out so the next user
 * on the same device cannot access a previous user's data.
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
          const userId = useAuthStore.getState().user?.id
          signOut()
          queryClient.clear()
          if (userId) clearPersistedCache(userId)
          return
        }

        // If a different user signs in, clear the previous user's in-memory cache
        // so stale data from the old session is not shown.
        const prevUserId = useAuthStore.getState().user?.id
        const nextUserId = session?.user?.id
        if (prevUserId && nextUserId && prevUserId !== nextUserId) {
          queryClient.clear()
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
