import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Returns the user id if the request carries a valid admin JWT, otherwise null. */
export async function verifyAdmin(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const client = createAdminClient()

  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) return null

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' ? user.id : null
}
