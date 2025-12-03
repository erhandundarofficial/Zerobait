import express from 'express'
import type { Request, Response } from 'express'
import { prisma } from '../prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = express.Router()

function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev-insecure-secret-change-me'
}

type JwtUser = { id: string; username: string | null; email: string | null }

function createToken(user: JwtUser) {
  const payload = { sub: user.id, username: user.username, email: user.email }
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

function safeUser(u: any) {
  return { id: u.id, username: u.username ?? null, email: u.email ?? null, score: u.score }
}

router.post('/auth/register', async (req: Request, res: Response) => {
  const { username, password, email } = req.body as { username?: string; password?: string; email?: string }
  if (!username || typeof username !== 'string' || username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' })
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  try {
    const orConds: any[] = []
    if (username) orConds.push({ username })
    if (email) orConds.push({ email })
    const existing = await (prisma.user as any).findFirst({ where: { OR: orConds } })
    if (existing) {
      return res.status(409).json({ error: 'Username or email already in use' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await (prisma.user as any).create({ data: { username, email: email ?? null, passwordHash } })
    const token = createToken({ id: user.id, username: user.username ?? null, email: user.email ?? null })
    return res.status(201).json({ token, user: safeUser(user) })
  } catch (e) {
    return res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string }
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' })

  try {
    const user = await (prisma.user as any).findFirst({ where: { username } })
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = createToken({ id: user.id, username: user.username ?? null, email: user.email ?? null })
    return res.json({ token, user: safeUser(user) })
  } catch (e) {
    return res.status(500).json({ error: 'Login failed' })
  }
})

router.get('/auth/me', async (req: Request, res: Response) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const token = auth.slice('Bearer '.length)
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { sub: string }
    const user = await (prisma.user as any).findUnique({ where: { id: decoded.sub } })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    return res.json({ user: safeUser(user) })
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
})

export default router
