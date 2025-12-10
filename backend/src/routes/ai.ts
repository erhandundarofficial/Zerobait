import express from 'express'
import type { Request, Response } from 'express'
import { analyzeUrlWithAI } from '../services/aiAnalysis'

const router = express.Router()

function normalizeForAI(input: string): string | null {
  try {
    let s = (input || '').trim()
    if (!s) return null
    // If missing scheme, default to https
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s
    // Try parse, if fails and missing www, try adding it
    const attempts: string[] = [s]
    if (!/^https?:\/\/www\./i.test(s)) attempts.push(s.replace(/^https?:\/\//i, 'https://www.'))
    for (const cand of attempts) {
      try {
        const u = new URL(cand)
        // Normalize: https only, lowercase host, drop query/hash, ensure trailing slash
        u.protocol = 'https:'
        u.hostname = u.hostname.toLowerCase()
        u.search = ''
        u.hash = ''
        if (!u.pathname || u.pathname === '') u.pathname = '/'
        if (!u.pathname.endsWith('/')) u.pathname = u.pathname + '/'
        if (!u.hostname || !u.hostname.includes('.')) continue
        return u.toString()
      } catch {
        // try next attempt
      }
    }
    return null
  } catch {
    return null
  }
}

router.post('/ai/analyze', async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string }
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Missing or invalid "url" in request body' })
  const normalized = normalizeForAI(url)
  if (!normalized) return res.status(400).json({ error: 'Invalid URL format. Expected like https://www.example.com/' })
  try {
    const result = await analyzeUrlWithAI(normalized)
    return res.json(result)
  } catch {
    return res.status(500).json({ error: 'Failed to analyze URL' })
  }
})

export default router
