import type { VercelRequest, VercelResponse } from '@vercel/node'

const OPEN5E_BASE = 'https://api.open5e.com/v2'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { path, ...rest } = req.query
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Missing path parameter' })
  }

  const url = new URL(`${OPEN5E_BASE}${path}`)
  for (const [key, value] of Object.entries(rest)) {
    if (typeof value === 'string') url.searchParams.set(key, value)
  }

  try {
    const upstream = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })
    const data = await upstream.json() as unknown
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
    return res.status(upstream.status).json(data)
  } catch {
    return res.status(502).json({ error: 'Open5e niet bereikbaar' })
  }
}
