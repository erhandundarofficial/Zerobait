import express from 'express'
import type { Request, Response } from 'express'
import { analyzeUrlWithAI } from '../services/aiAnalysis'

const router = express.Router()

router.post('/ai/analyze', async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string }
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Missing or invalid "url" in request body' })
  try {
    const result = await analyzeUrlWithAI(url)
    return res.json(result)
  } catch {
    return res.status(500).json({ error: 'Failed to analyze URL' })
  }
})

export default router
