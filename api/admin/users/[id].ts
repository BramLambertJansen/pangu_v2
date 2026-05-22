import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

function createAdminClient() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function verifyAdmin(authHeader: string | undefined): Promise<string | null> {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const adminId = await verifyAdmin(req.headers.authorization)
    if (!adminId) return res.status(401).json({ error: 'Niet geautoriseerd' })

    const { id } = req.query as { id: string }
    const client = createAdminClient()

    if (req.method === 'PATCH') {
      const { display_name, email, password } = req.body as {
        display_name?: string
        email?: string
        password?: string
      }

      // Update auth (email / password) via admin API
      const authUpdates: { email?: string; password?: string } = {}
      if (email !== undefined) authUpdates.email = email
      if (password) authUpdates.password = password

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await client.auth.admin.updateUserById(id, authUpdates)
        if (authError) { console.error('[admin/users PATCH] updateUserById', authError.message); return res.status(400).json({ error: 'Bijwerken mislukt' }) }
      }

      // Update profile columns
      const profileUpdates: Record<string, unknown> = {}
      if (display_name !== undefined) profileUpdates.display_name = display_name
      if (email !== undefined) profileUpdates.email = email

      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await client.from('profiles').update(profileUpdates).eq('id', id)
        if (error) { console.error('[admin/users PATCH] update profile', error.message); return res.status(400).json({ error: 'Bijwerken mislukt' }) }
      }

      return res.json({ success: true })
    }

    if (req.method === 'DELETE') {
      // Prevent self-deletion
      if (id === adminId) {
        return res.status(400).json({ error: 'Je kunt je eigen account niet verwijderen' })
      }

      const { error } = await client.auth.admin.deleteUser(id)
      if (error) { console.error('[admin/users DELETE]', error.message); return res.status(400).json({ error: 'Verwijderen mislukt' }) }
      return res.json({ success: true })
    }

    return res.status(405).json({ error: 'Methode niet toegestaan' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Serverfout'
    return res.status(500).json({ error: message })
  }
}
