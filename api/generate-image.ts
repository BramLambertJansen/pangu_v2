import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Niet ingelogd' })
  }

  const token = authHeader.slice(7)
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Server configuratiefout' })
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: { user }, error: authError } = await adminClient.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Ongeldige sessie' })

  const { prompt } = req.body as { prompt?: string }
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Geen prompt opgegeven' })
  }

  // Fetch user's BYOK OpenAI key
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settings } = await (adminClient as any)
    .from('user_ai_settings')
    .select('byok_keys')
    .eq('user_id', user.id)
    .maybeSingle() as { data: { byok_keys?: Record<string, string> } | null }

  const openaiKey = settings?.byok_keys?.['openai']
  if (!openaiKey) {
    return res.status(422).json({ error: 'no_byok_key' })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      }),
    })

    if (!response.ok) {
      const err = await response.json() as { error?: { message?: string } }
      return res.status(response.status).json({
        error: err.error?.message ?? 'DALL-E generatie mislukt',
      })
    }

    const result = await response.json() as { data: { url: string }[] }
    const url = result.data[0]?.url
    if (!url) return res.status(500).json({ error: 'Geen afbeelding ontvangen' })

    return res.status(200).json({ url })
  } catch {
    return res.status(502).json({ error: 'OpenAI niet bereikbaar' })
  }
}
