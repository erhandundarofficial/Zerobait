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
    const difficultyRaw = (content as any).difficulty
    const difficulty = typeof difficultyRaw === 'string' && difficultyRaw.trim()
      ? difficultyRaw.trim().toLowerCase()
      : 'unknown'

    let awarded = false
    if (userId) {
      try {
        await prisma.$transaction(
          async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } })
            if (!user) return
            const game = await tx.game.findUnique({ where: { key } })
            if (!game) return
            const existing = await (tx.gameSession as any).findFirst({
              where: {
                userId: user.id,
                gameId: game.id,
                OR: [
                  { difficulty: { equals: difficulty, mode: 'insensitive' } },
                  { difficulty: 'unknown' },
                ],
              },
            })
            await (tx.gameSession as any).create({ data: { userId: user.id, gameId: game.id, score, difficulty } })
            if (!existing) {
              await tx.user.update({ where: { id: user.id }, data: { score: user.score + score } })
              awarded = true
            }
          },
          { isolationLevel: 'Serializable' },
        )
      } catch {
      }
    }

    return res.json({ score, awarded, awardedDelta: awarded ? score : 0 })
  },
)

router.post('/games/password-puzzle/complete', async (
  req: Request<unknown, unknown, { difficulty?: string; userId?: string }>,
  res: Response,
) => {
  const { difficulty: dRaw, userId } = req.body
  const difficulty = typeof dRaw === 'string' && dRaw.trim() ? dRaw.trim().toLowerCase() : 'unknown'
  const POINTS: Record<string, number> = { easy: 50, medium: 100, hard: 200 }
  const score = POINTS[difficulty] ?? 0

  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  let awarded = false
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } })
      if (!user) return
      const game = await tx.game.upsert({
        where: { key: 'password_puzzle' },
        update: { title: 'Password Puzzle', description: 'Build a strong password', type: 'puzzle' },
        create: { key: 'password_puzzle', title: 'Password Puzzle', description: 'Build a strong password', type: 'puzzle' },
      })
      const existing = await (tx.gameSession as any).findFirst({
        where: {
          userId: user.id,
          gameId: game.id,
          OR: [
            { difficulty: { equals: difficulty, mode: 'insensitive' } },
            { difficulty: 'unknown' },
          ],
        },
      })
      await (tx.gameSession as any).create({ data: { userId: user.id, gameId: game.id, score, difficulty } })
      if (!existing && score > 0) {
        await tx.user.update({ where: { id: user.id }, data: { score: user.score + score } })
        awarded = true
      }
    }, { isolationLevel: 'Serializable' })
  } catch {
    return res.status(500).json({ error: 'Failed to complete puzzle' })
  }

  return res.json({ success: true, awarded, awardedDelta: awarded ? score : 0 })
})

export default router
