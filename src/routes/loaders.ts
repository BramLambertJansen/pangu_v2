import { redirect } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return redirect('/login')
  return null
}

export async function requireAdmin() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return redirect('/login')

  // Use persisted profile from store to avoid an extra round-trip on every navigation
  const { profile } = useAuthStore.getState()
  if (profile !== null) {
    return profile.role === 'admin' ? null : redirect('/dashboard')
  }

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (data?.role !== 'admin') return redirect('/dashboard')
  return null
}
