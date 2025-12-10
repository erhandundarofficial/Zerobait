import express from 'express'
import type { Request, Response } from 'express'
import { prisma } from '../prisma'

const router = express.Router()

function parseWindow(v?: string) {
  const w = (v || 'all').toLowerCase()
  if (w === '7d' || w === '30d' || w === '24h' || w === 'all') return w
  return 'all'
}

function windowToSince(w: string): Date | null {
  const now = new Date()
  if (w === '24h') return new Date(now.getTime() - 24 * 60 * 60 * 1000)
  if (w === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  if (w === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return null
}

router.get('/leaderboard', async (req: Request, res: Response) => {
  const windowParam = parseWindow(typeof req.query.window === 'string' ? req.query.window : undefined)
  const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : NaN
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 1000) : 50
  const offsetRaw = typeof req.query.offset === 'string' ? parseInt(req.query.offset, 10) : NaN
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0
  const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined

  try {
    if (windowParam === 'all') {
      // All-time awarded: first session per (userId, gameId, difficulty) across all time
      const total = await prisma.user.count()
      const pageRows = await prisma.$queryRaw<{ userId: string; username: string | null; score: number }[]>`
        WITH first_sessions AS (
          SELECT DISTINCT ON ("userId", "gameId", "difficulty")
                 "userId", "gameId", "difficulty", "score", "startedAt"
          FROM "GameSession"
          ORDER BY "userId", "gameId", "difficulty", "startedAt" ASC
        ),
        sums AS (
          SELECT "userId", SUM("score")::int AS s FROM first_sessions GROUP BY "userId"
        )
        SELECT u.id AS "userId", u.username, COALESCE(s.s, 0)::int AS score
        FROM "User" u
        LEFT JOIN sums s ON s."userId" = u.id
        ORDER BY score DESC, u."createdAt" ASC
        OFFSET ${offset}
        LIMIT ${limit}
      `
      const leaders = pageRows.map((row, i) => ({ userId: row.userId, username: row.username ?? null, score: row.score || 0, rank: offset + i + 1 }))

      let me: { userId: string; username: string | null; score: number; rank: number } | null = null
      if (userId) {
        const meRows = await prisma.$queryRaw<{ score: number }[]>`
          WITH first_sessions AS (
            SELECT DISTINCT ON ("userId", "gameId", "difficulty")
                   "userId", "gameId", "difficulty", "score", "startedAt"
            FROM "GameSession"
            ORDER BY "userId", "gameId", "difficulty", "startedAt" ASC
          ),
          sums AS (
            SELECT "userId", SUM("score") AS s FROM first_sessions GROUP BY "userId"
          )
          SELECT COALESCE(s.s, 0) AS score
          FROM "User" u
          LEFT JOIN sums s ON s."userId" = u.id
          WHERE u.id = ${userId}
        `
        const meScore = (Array.isArray(meRows) && meRows[0]?.score ? Number(meRows[0].score) : 0) as number
        const higherRows = await prisma.$queryRaw<{ cnt: number }[]>`
          WITH first_sessions AS (
            SELECT DISTINCT ON ("userId", "gameId", "difficulty")
                   "userId", "gameId", "difficulty", "score", "startedAt"
            FROM "GameSession"
            ORDER BY "userId", "gameId", "difficulty", "startedAt" ASC
          ),
          sums AS (
            SELECT u.id, COALESCE(s.s, 0) AS score
            FROM "User" u
            LEFT JOIN (
              SELECT "userId", SUM("score") AS s FROM first_sessions GROUP BY "userId"
            ) s ON s."userId" = u.id
          )
          SELECT COUNT(*)::int AS cnt FROM sums WHERE score > ${meScore}
        `
        const higher = Array.isArray(higherRows) && higherRows[0]?.cnt ? higherRows[0].cnt : 0
        const meUser = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } })
        me = { userId, username: meUser?.username ?? null, score: meScore, rank: higher + 1 }
      }

      return res.json({ window: windowParam, leaders, me, total, limit, offset, hasPrev: offset > 0, hasNext: offset + leaders.length < total })
    }

    const since = windowToSince(windowParam)
    if (!since) return res.status(400).json({ error: 'Invalid window' })

    const total = await prisma.user.count()

    // Pull page with all users using LEFT JOIN over first sessions within window to include zero recent awards
    const pageRows = await prisma.$queryRaw<{ userId: string; username: string | null; score: number }[]>`
      WITH first_sessions AS (
        SELECT DISTINCT ON ("userId", "gameId", "difficulty")
               "userId", "gameId", "difficulty", "score", "startedAt"
        FROM (
          SELECT * FROM "GameSession" WHERE "startedAt" >= ${since}
          UNION ALL
          SELECT * FROM "GameSession" WHERE "startedAt" < ${since}
        ) t
        ORDER BY "userId", "gameId", "difficulty", "startedAt" ASC
      ),
      window_awards AS (
        SELECT fs."userId", fs."score", fs."startedAt"
        FROM first_sessions fs
        WHERE fs."startedAt" >= ${since}
      ),
      sums AS (
        SELECT "userId", COALESCE(SUM("score"), 0)::int AS s FROM window_awards GROUP BY "userId"
      )
      SELECT u.id AS "userId", u.username, COALESCE(s.s, 0)::int AS score
      FROM "User" u
      LEFT JOIN sums s ON s."userId" = u.id
      ORDER BY score DESC, u."createdAt" ASC
      OFFSET ${offset}
      LIMIT ${limit}
    `

    const leaders = pageRows.map((row, i) => ({
      userId: row.userId,
      username: row.username ?? null,
      score: row.score || 0,
      rank: offset + i + 1,
    }))

    let me: { userId: string; username: string | null; score: number; rank: number } | null = null
    if (userId) {
      const meRows = await prisma.$queryRaw<{ score: number }[]>`
        WITH first_sessions AS (
          SELECT DISTINCT ON ("userId", "gameId", "difficulty")
                 "userId", "gameId", "difficulty", "score", "startedAt"
          FROM (
            SELECT * FROM "GameSession" WHERE "startedAt" >= ${since}
            UNION ALL
            SELECT * FROM "GameSession" WHERE "startedAt" < ${since}
          ) t
          ORDER BY "userId", "gameId", "difficulty", "startedAt" ASC
        ),
        window_awards AS (
          SELECT fs."userId", fs."score", fs."startedAt"
          FROM first_sessions fs
          WHERE fs."startedAt" >= ${since}
        ),
        sums AS (
          SELECT "userId", COALESCE(SUM("score"), 0) AS s FROM window_awards GROUP BY "userId"
        )
        SELECT COALESCE(s.s, 0) AS score
        FROM "User" u
        LEFT JOIN sums s ON s."userId" = u.id
        WHERE u.id = ${userId}
      `
      const meScore = (Array.isArray(meRows) && meRows[0]?.score ? Number(meRows[0].score) : 0) as number
      const higherRows = await prisma.$queryRaw<{ cnt: number }[]>`
        WITH first_sessions AS (
          SELECT DISTINCT ON ("userId", "gameId", "difficulty")
                 "userId", "gameId", "difficulty", "score", "startedAt"
          FROM (
            SELECT * FROM "GameSession" WHERE "startedAt" >= ${since}
            UNION ALL
            SELECT * FROM "GameSession" WHERE "startedAt" < ${since}
          ) t
          ORDER BY "userId", "gameId", "difficulty", "startedAt" ASC
        ),
        window_awards AS (
          SELECT fs."userId", fs."score", fs."startedAt"
          FROM first_sessions fs
          WHERE fs."startedAt" >= ${since}
        ),
        sums AS (
          SELECT u.id, COALESCE(s.s, 0) AS score
          FROM "User" u
          LEFT JOIN (
            SELECT "userId", SUM("score") AS s FROM window_awards GROUP BY "userId"
          ) s ON s."userId" = u.id
        )
        SELECT COUNT(*)::int AS cnt FROM sums WHERE score > ${meScore}
      `
      const higher = Array.isArray(higherRows) && higherRows[0]?.cnt ? higherRows[0].cnt : 0
      const meUser = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } })
      me = { userId, username: meUser?.username ?? null, score: meScore, rank: higher + 1 }
    }

    return res.json({ window: windowParam, leaders, me, total, limit, offset, hasPrev: offset > 0, hasNext: offset + leaders.length < total })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load leaderboard' })
  }
})

export default router
