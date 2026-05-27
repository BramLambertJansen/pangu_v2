import { redirect } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { DEV_MODE } from '@/lib/constants'

export function requireRegistrationEnabled() {
  if (DEV_MODE) return redirect('/login')
  return null
}

export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return redirect('/login')
  return null
}

export async function requireAdmin() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return redirect('/login')

  // Always verify role from the database — never trust the cached store value,
  // since a revoked admin would otherwise keep /admin access until logout.
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (data?.role !== 'admin') return redirect('/dashboard')

  // Keep the in-memory store in sync if role changed externally.
  const { profile, setProfile } = useAuthStore.getState()
  if (profile && profile.role !== data.role) {
    setProfile({ ...profile, role: data.role as 'user' | 'admin' })
  }

  return null
}
