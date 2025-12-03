import express from 'express'
import type { Request, Response } from 'express'
import { prisma } from '../prisma'
import { computeScore, ensureGameRecords, loadAllGameContents, loadGameContent, toPublic } from '../services/games'

const router = express.Router()

router.get('/games', async (_req: Request, res: Response) => {
  try {
    const contents = await loadAllGameContents()
    await ensureGameRecords(contents)
    const list = contents.map((c) => ({ key: c.key, title: c.title, description: c.description, type: c.type, difficulty: c.difficulty }))
    return res.json({ games: list })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load games' })
  }
})

router.get('/games/:key', async (req: Request<{ key: string }>, res: Response) => {
  const key = req.params.key
  const content = await loadGameContent(key)
  if (!content) return res.status(404).json({ error: 'Game not found' })
  return res.json({ game: toPublic(content) })
})

router.post(
  '/games/:key/submit',
  async (
    req: Request<{ key: string }, unknown, { answers?: Record<string, number>; userId?: string }>,
    res: Response,
  ) => {
    const key = req.params.key
    const { answers, userId } = req.body
    if (!answers || typeof answers !== 'object') return res.status(400).json({ error: 'Missing or invalid answers' })

    const content = await loadGameContent(key)
    if (!content) return res.status(404).json({ error: 'Game not found' })

    const score = computeScore(content, answers)

    if (userId) {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (user) {
          const game = await prisma.game.findUnique({ where: { key } })
          if (game) {
            await prisma.gameSession.create({ data: { userId: user.id, gameId: game.id, score } })
            await prisma.user.update({ where: { id: user.id }, data: { score: user.score + score } })
          }
        }
      } catch {
      }
    }

    return res.json({ score })
  },
)

export default router
