import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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

function getProgressStorageKey(currentUserId?: string | null): string {
  const owner = currentUserId || getOrCreatePlayerId()
  return `zb_progress_${owner}`
}

function saveProgress(gameKey: string, score: number, currentUserId?: string | null) {
  const storageKey = getProgressStorageKey(currentUserId)
  let raw = localStorage.getItem(storageKey)
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
  localStorage.setItem(storageKey, JSON.stringify(store))
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
  const navigate = useNavigate()
  const { user, addScore, logout } = useAuth()
  const [game, setGame] = useState<PublicGameContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [started] = useState(true)

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
      saveProgress(gameKey, s, user?.id)
      if (user?.id) {
        // update UI user score only if server awarded points
        const delta = typeof data.awardedDelta === 'number' ? data.awardedDelta : 0
        if (delta > 0) addScore(delta)
      }
    } catch (e: any) {
      setError(e?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  function choose(qid: string, idx: number) {
    setAnswers((prev) => ({ ...prev, [qid]: idx }))
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-white">
      {/* Background grid overlay (purple emphasis) */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(255,0,255,0.15),transparent)]"></div>
      </div>

      <div className="layout-container z-10 flex h-full grow flex-col">
        <div className="flex flex-1 justify-center px-4 sm:px-10 md:px-20 lg:px-40 py-5">
          <div className="layout-content-container flex w-full max-w-[960px] flex-1 flex-col">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap px-4 sm:px-10 py-3">
              <div className="flex items-center gap-4">
                <div className="text-primary">
                  <span className="material-symbols-outlined !text-3xl text-glow-cyan">shield</span>
                </div>
                <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">Zerobait</h2>
              </div>
              <div className="hidden md:flex flex-1 justify-end items-center gap-6">
                <nav className="flex items-center gap-2">
                  <Link className="text-white/80 hover:text-white transition-colors text-sm font-bold leading-normal flex items-center gap-2 group px-4 py-2 rounded-md hover:bg-primary/20" to="/">
                    <span className="material-symbols-outlined text-primary group-hover:text-glow-cyan transition-all duration-300">home</span>
                    <span className="group-hover:text-glow-cyan transition-all duration-300">Dashboard</span>
                  </Link>
                  <Link className="text-white/80 hover:text-white transition-colors text-sm font-bold leading-normal flex items-center gap-2 group px-4 py-2 rounded-md hover:bg-secondary/20" to="/games">
                    <span className="material-symbols-outlined text-secondary group-hover:text-glow-magenta transition-all duration-300">gamepad</span>
                    <span className="group-hover:text-glow-magenta transition-all duration-300">Games</span>
                  </Link>
                </nav>
                <div className="w-px h-6 bg-white/20"></div>
                <div className="flex items-center gap-4 pl-6">
                  {!user ? (
                    <>
                      <Link className="text-white/80 hover:text-white transition-colors text-sm font-bold leading-normal px-4 py-2 rounded-md hover:bg-white/10" to="/login">Log In</Link>
                      <Link className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-4 bg-primary text-black hover:bg-primary/90 transition-all duration-300 text-sm font-bold leading-normal tracking-[0.015em]" to="/signup">
                        <span className="truncate">Sign Up</span>
                      </Link>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white/80">Hello, <span className="text-primary font-semibold">{user.username ?? 'user'}</span></span>
                      <button
                        onClick={() => { logout(); navigate('/'); }}
                        className="flex h-9 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-white/10 px-3 text-xs font-semibold leading-normal text-gray-200 transition-colors hover:bg-white/20"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Main content */}
            <main className="flex-grow">
              {/* Loading/Error States */}
              {loading && <p className="mt-8 text-center text-white/80">Loading…</p>}
              {error && <p className="mt-8 text-center text-red-400">{error}</p>}

              {!loading && !error && (
                <div className="space-y-6">
                  {/* Hero */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-secondary font-bold uppercase tracking-wider text-glow-magenta">Game</p>
                      <h1 className="text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.03em]">{game?.title}</h1>
                      <p className="text-white/70 mt-2 max-w-2xl">{game?.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-md bg-white/10 text-white/80 uppercase">{game?.difficulty}</span>
                      <Link to="/games" className="text-sm font-bold text-secondary hover:text-white transition-colors">Back</Link>
                    </div>
                  </div>

                  

                  {/* Quiz/Questions (as current implementation) */}
                  {started && game && (
                    <>
                      <div className="mt-2 space-y-6">
                        {game.questions.map((q, qi) => (
                          <div key={q.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
                            <div className="flex items-start justify-between gap-4">
                              <h3 className="text-white font-semibold">Q{qi + 1}. {q.prompt}</h3>
                              <span className="text-xs px-2 py-1 rounded-md bg-white/10 text-gray-200 uppercase">{game.difficulty}</span>
                            </div>
                            <div className="mt-4 grid gap-2">
                              {q.options.map((opt, idx) => (
                                <label key={idx} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 cursor-pointer hover:border-secondary/40">
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
                    </>
                  )}
                </div>
              )}
            </main>

            {/* Footer */}
            <footer className="mt-auto w-full border-t border-white/10 bg-background-dark/50 py-8 backdrop-blur-sm">
              <div className="mx-auto flex max-w-[960px] flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-10">
                <p className="text-sm text-white/60">© 2024 Zerobait. All rights reserved.</p>
                <nav className="flex flex-wrap justify-center gap-4 sm:gap-6">
                  <a className="text-sm font-medium text-white/80 transition-colors hover:text-primary" href="#">Privacy Policy</a>
                  <a className="text-sm font-medium text-white/80 transition-colors hover:text-secondary" href="#">About</a>
                  <a className="text-sm font-medium text-white/80 transition-colors hover:text-secondary" href="#">Contact</a>
                </nav>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}
