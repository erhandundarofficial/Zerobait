import express from 'express'
import type { Request, Response } from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
import scanRouter from './routes/scan'
import gamesRouter from './routes/games'
import authRouter from './routes/auth'
import progressRouter from './routes/progress'
import aiRouter from './routes/ai'
import leaderboardRouter from './routes/leaderboard'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.use('/api', scanRouter)
app.use('/api', gamesRouter)
app.use('/api', authRouter)
app.use('/api', progressRouter)
app.use('/api', aiRouter)
app.use('/api', leaderboardRouter)

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'zerobait-backend' })
})

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`)
})
