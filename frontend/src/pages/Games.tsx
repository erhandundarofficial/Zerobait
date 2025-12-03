import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type GameListItem = {
  key: string
  title: string
  description: string
  type: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export default function GamesPage() {
  const [games, setGames] = useState<GameListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      setError(null)
      setLoading(true)
      try {
        const res = await fetch('http://localhost:4000/api/games')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load games')
        if (alive) setGames(data.games || [])
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load games')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-white text-4xl font-bold leading-tight tracking-tighter sm:text-5xl lg:text-6xl">Games</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-normal leading-normal text-gray-300 sm:text-lg">
          Practice your skills with quick, fun quizzes. Earn points and level up.
        </p>
      </div>

      {loading && <p className="mt-8 text-center text-gray-300">Loading…</p>}
      {error && <p className="mt-8 text-center text-red-400">{error}</p>}

      {!loading && !error && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <Link
              key={g.key}
              to={`/games/${g.key}`}
              className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-emerald-400/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">{g.title}</h3>
                <span className="text-xs px-2 py-1 rounded-md bg-white/10 text-gray-200 uppercase">{g.difficulty}</span>
              </div>
              <p className="mt-2 text-gray-300 text-sm">{g.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
