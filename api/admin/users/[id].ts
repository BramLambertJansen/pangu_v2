import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createAdminClient, verifyAdmin } from '../_auth.js'

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
