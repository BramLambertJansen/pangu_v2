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
      const { role, display_name } = req.body as {
        role?: 'user' | 'admin'
        display_name?: string
      }

      // Prevent admins from demoting their own account
      if (role !== undefined && id === adminId) {
        return res.status(400).json({ error: 'Je kunt je eigen rol niet aanpassen' })
      }

      const updates: Record<string, unknown> = {}
      if (role !== undefined) updates.role = role
      if (display_name !== undefined) updates.display_name = display_name

      const { error } = await client.from('profiles').update(updates).eq('id', id)
      if (error) return res.status(400).json({ error: error.message })
      return res.json({ success: true })
    }

    if (req.method === 'DELETE') {
      // Prevent self-deletion
      if (id === adminId) {
        return res.status(400).json({ error: 'Je kunt je eigen account niet verwijderen' })
      }

      const { error } = await client.auth.admin.deleteUser(id)
      if (error) return res.status(400).json({ error: error.message })
      return res.json({ success: true })
    }

    return res.status(405).json({ error: 'Methode niet toegestaan' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Serverfout'
    return res.status(500).json({ error: message })
  }
}
