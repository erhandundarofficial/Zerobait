import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

type PublicQuestion = {
  id: string
  prompt: string
  options: string[]
  explanation?: string
}

// Simple client-side progress tracking
type ProgressStore = {
  totalScore: number
  games: Record<string, { bestScore: number; attempts: number; lastScore: number; lastPlayedAt: string }>
}

function getOrCreatePlayerId(): string {
  let id = localStorage.getItem('zb_player_id')
  if (!id) {
    id = 'player_' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('zb_player_id', id)
  }
  return id
}

function saveProgress(gameKey: string, score: number) {
  let raw = localStorage.getItem('zb_progress')
  const now = new Date().toISOString()
  let store: ProgressStore
  if (!raw) {
    store = { totalScore: 0, games: {} }
  } else {
    try {
      store = JSON.parse(raw) as ProgressStore
    } catch {
      store = { totalScore: 0, games: {} }
    }
  }
  const prev = store.games[gameKey]
  const best = Math.max(prev?.bestScore ?? 0, score)
  const attempts = (prev?.attempts ?? 0) + 1
  store.games[gameKey] = { bestScore: best, attempts, lastScore: score, lastPlayedAt: now }
  store.totalScore = (store.totalScore ?? 0) + score
  localStorage.setItem('zb_progress', JSON.stringify(store))
}

type PublicGameContent = {
  key: string
  title: string
  description: string
  type: string
  difficulty: 'easy' | 'medium' | 'hard'
  questions: PublicQuestion[]
}

export default function GamePlayPage() {
  const { key } = useParams<{ key: string }>()
  const { user } = useAuth()
  const [game, setGame] = useState<PublicGameContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    if (!key) return
    const gameKey: string = key as string
    let alive = true
    async function load() {
      setError(null)
      setLoading(true)
      try {
        const res = await fetch(`http://localhost:4000/api/games/${encodeURIComponent(gameKey)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load game')
        if (alive) setGame(data.game as PublicGameContent)
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load game')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [key])

  const allAnswered = useMemo(() => {
    if (!game) return false
    return game.questions.every((q) => typeof answers[q.id] === 'number')
  }, [answers, game])

  async function submit() {
    if (!key || !game) return
    const gameKey: string = key as string
    setSubmitting(true)
    setScore(null)
    try {
      const res = await fetch(`http://localhost:4000/api/games/${encodeURIComponent(gameKey)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, userId: user?.id ?? getOrCreatePlayerId() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      const s = data.score as number
      setScore(s)
      saveProgress(gameKey, s)
    } catch (e: any) {
      setError(e?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  function choose(qid: string, idx: number) {
    setAnswers((prev) => ({ ...prev, [qid]: idx }))
  }

  if (loading) return <p className="text-center text-gray-300">Loading…</p>
  if (error) return <p className="text-center text-red-400">{error}</p>
  if (!game) return <p className="text-center text-gray-300">Game not found.</p>

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-3xl font-bold">{game.title}</h1>
          <p className="text-gray-300 mt-1">{game.description}</p>
        </div>
        <Link to="/games" className="text-emerald-300 hover:underline text-sm">Back to Games</Link>
      </div>

      <div className="mt-8 space-y-6">
        {game.questions.map((q, qi) => (
          <div key={q.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-white font-semibold">Q{qi + 1}. {q.prompt}</h3>
              <span className="text-xs px-2 py-1 rounded-md bg-white/10 text-gray-200 uppercase">{game.difficulty}</span>
            </div>
            <div className="mt-4 grid gap-2">
              {q.options.map((opt, idx) => (
                <label key={idx} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 cursor-pointer hover:border-emerald-400/40">
                  <input
                    type="radio"
                    name={q.id}
                    className="accent-emerald-400"
                    checked={answers[q.id] === idx}
                    onChange={() => choose(q.id, idx)}
                  />
                  <span className="text-gray-200">{opt}</span>
                </label>
              ))}
            </div>
            {q.explanation && <p className="mt-2 text-xs text-gray-400">Hint: {q.explanation}</p>}
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={submit}
          disabled={submitting || !allAnswered}
          className="flex h-12 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-emerald-400 px-6 text-base font-bold leading-normal text-gray-900 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? 'Submitting…' : 'Submit Answers'}
        </button>
        {score !== null && (
          <span className="text-gray-200">Your score: <span className="text-emerald-300 font-semibold">{score}</span></span>
        )}
      </div>
    </div>
  )
}
