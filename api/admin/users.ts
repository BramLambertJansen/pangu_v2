import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createAdminClient, verifyAdmin } from './_auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminId = await verifyAdmin(req.headers.authorization)
  if (!adminId) return res.status(401).json({ error: 'Niet geautoriseerd' })

  const client = createAdminClient()

  if (req.method === 'GET') {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'POST') {
    const { email, password, display_name, role } = req.body as {
      email: string
      password: string
      display_name: string
      role: 'user' | 'admin'
    }

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'E-mail, wachtwoord en rol zijn verplicht' })
    }

    const { data, error } = await client.auth.admin.createUser({
      email,
      password,
      user_metadata: { display_name, role },
      email_confirm: true,
    })

    if (error) return res.status(400).json({ error: error.message })

    // Ensure role is set correctly (trigger may default to 'user')
    await client.from('profiles').update({ role, display_name }).eq('id', data.user.id)

    return res.status(201).json(data.user)
  }

  return res.status(405).json({ error: 'Methode niet toegestaan' })
}
