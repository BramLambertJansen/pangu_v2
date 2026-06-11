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
  const { data: settings } = await adminClient
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
        response_format: 'b64_json',
      }),
    })

    if (!response.ok) {
      const err = await response.json() as { error?: { message?: string } }
      return res.status(response.status).json({
        error: err.error?.message ?? 'DALL-E generatie mislukt',
      })
    }

    const result = await response.json() as { data: { b64_json: string }[] }
    const b64 = result.data[0]?.b64_json
    if (!b64) return res.status(500).json({ error: 'Geen afbeelding ontvangen' })

    // Upload to Supabase Storage so the URL is permanent
    const imageBuffer = Buffer.from(b64, 'base64')
    const fileName = `items/${user.id}/${Date.now()}.png`

    const { error: uploadError } = await adminClient.storage
      .from('entity-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      })

    if (uploadError) {
      return res.status(500).json({ error: `Opslaan afbeelding mislukt: ${uploadError.message}` })
    }

    const { data: publicUrlData } = adminClient.storage
      .from('entity-images')
      .getPublicUrl(fileName)

    return res.status(200).json({ url: publicUrlData.publicUrl })
  } catch {
    return res.status(502).json({ error: 'OpenAI niet bereikbaar' })
  }
}
