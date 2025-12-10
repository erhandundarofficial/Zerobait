import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

type GameListItem = {
  key: string
  title: string
  description: string
  type: string
  difficulty: 'easy' | 'medium' | 'hard'
}

type LeaderboardEntry = {
  userId: string
  username: string | null
  score: number
  rank: number
}

export default function GamesPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [games, setGames] = useState<GameListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lbWindow, setLbWindow] = useState<'all' | '24h' | '7d' | '30d'>('all')
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])
  const [me, setMe] = useState<LeaderboardEntry | null>(null)
  const [lbLoading, setLbLoading] = useState(true)
  const [lbError, setLbError] = useState<string | null>(null)
  const LIMIT = 5
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasPrev, setHasPrev] = useState(false)
  const [hasNext, setHasNext] = useState(false)

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

  useEffect(() => {
    let active = true
    async function loadLeaderboard() {
      setLbError(null)
      setLbLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('window', lbWindow)
        if (user?.id) params.set('userId', user.id)
        params.set('limit', String(LIMIT))
        params.set('offset', String(page * LIMIT))
        const res = await fetch(`http://localhost:4000/api/leaderboard?${params.toString()}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load leaderboard')
        if (!active) return
        setLeaders((data.leaders || []) as LeaderboardEntry[])
        setMe((data.me ?? null) as LeaderboardEntry | null)
        setTotal(typeof data.total === 'number' ? data.total : 0)
        setHasPrev(Boolean(data.hasPrev))
        setHasNext(Boolean(data.hasNext))
      } catch (e: any) {
        if (active) {
          setLbError(e?.message || 'Failed to load leaderboard')
          setLeaders([])
          setMe(null)
          setTotal(0)
          setHasPrev(false)
          setHasNext(false)
        }
      } finally {
        if (active) setLbLoading(false)
      }
    }
    loadLeaderboard()
    return () => {
      active = false
    }
  }, [lbWindow, user?.id, page])

  const iconFor = useMemo(() => {
    return (g: GameListItem) => {
      const k = g.key.toLowerCase()
      if (k.includes('email')) return 'mail'
      if (k.includes('url') || k.includes('link')) return 'link'
      if (k.includes('password')) return 'password'
      if (k.includes('social')) return 'group'
      return 'gamepad'
    }
  }, [])

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-white">
      {/* Background grid overlay (purple theme) */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(255,0,255,0.15),transparent)]"></div>
      </div>

      <div className="layout-container z-10 flex h-full grow flex-col">
        <div className="flex flex-1 justify-center px-4 sm:px-10 md:px-20 lg:px-40 py-5">
          <div className="layout-content-container flex w-full max-w-[960px] flex-1 flex-col">
            {/* Header (exactly like dashboard/home) */}
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
            <div className="mb-8">
          <p className="text-secondary font-bold uppercase tracking-wider text-glow-magenta">Game Modes</p>
          <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Choose your challenge</h1>
          <p className="text-white/70 text-base max-w-3xl mt-2">Practice your phishing awareness with short, focused scenarios. Earn points and level up your skills.</p>
        </div>

            {loading && <p className="mt-8 text-center text-white/80">Loading…</p>}
            {error && <p className="mt-8 text-center text-red-400">{error}</p>}

            {!loading && !error && (
              <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
            {/* Sidebar game modes */}
            <aside className="flex flex-col gap-4">
              <div className="rounded-xl border border-secondary/30 bg-white/5 p-4">
                <h3 className="text-white text-lg font-bold mb-3 text-secondary text-glow-magenta">Browse Games</h3>
                <nav className="flex flex-col gap-2">
                  <Link
                    to={`/games/password-puzzle`}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-white/90 transition-all hover:bg-secondary/10 hover:border-secondary/40"
                  >
                    <span className="material-symbols-outlined text-secondary">password</span>
                    <div className="flex-1">
                      <p className="font-semibold text-white">Password Security Puzzle</p>
                      <p className="text-xs text-white/70 line-clamp-1">Build a strong password and beat the crack-time target.</p>
                    </div>
                    <span className="text-[10px] uppercase rounded-md bg-white/10 px-2 py-1 text-white/70">easy/med/hard</span>
                    <span className="material-symbols-outlined text-white/60">chevron_right</span>
                  </Link>
                  {games.map((g) => (
                    <Link
                      key={g.key}
                      to={`/games/${g.key}`}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-white/90 transition-all hover:bg-secondary/10 hover:border-secondary/40"
                    >
                      <span className="material-symbols-outlined text-secondary">{iconFor(g)}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{g.title}</p>
                        <p className="text-xs text-white/70 line-clamp-1">{g.description}</p>
                      </div>
                      <span className="text-[10px] uppercase rounded-md bg-white/10 px-2 py-1 text-white/70">{g.difficulty}</span>
                      <span className="material-symbols-outlined text-white/60">chevron_right</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main content */}
            <section className="flex flex-col gap-8">
              {/* Stats */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-secondary/30 bg-white/5 p-6 text-center">
                  <p className="text-white/70 text-sm">Total Score</p>
                  <p className="text-secondary text-6xl font-black my-1 text-glow-magenta">{user?.score ?? 0}</p>
                  <div className="flex items-center justify-center gap-2 text-ok">
                    <span className="material-symbols-outlined text-lg">trending_up</span>
                    <span className="text-sm font-bold">Keep it up!</span>
                  </div>
                </div>
                <div className="rounded-xl border border-secondary/30 bg-white/5 p-6 text-center">
                  <p className="text-white/70 text-sm">Your Rank ({lbWindow === 'all' ? 'All-time' : lbWindow})</p>
                  {lbLoading ? (
                    <p className="text-white/80">Loading…</p>
                  ) : me ? (
                    <>
                      <p className="text-secondary text-6xl font-black my-1 text-glow-magenta">#{me.rank}</p>
                      <p className="text-white/60 text-sm">Your {lbWindow === 'all' ? 'total' : 'recent'} score: {me.score}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-secondary text-4xl font-black my-1 text-glow-magenta">—</p>
                      <p className="text-white/60 text-sm">Not ranked yet</p>
                    </>
                  )}
                </div>
              </div>

              {/* Removed All Games grid as requested */}

              {/* Bottom Leaderboard */}
              <div className="rounded-xl border border-white/20 bg-white/5 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white text-glow-magenta">Leaderboard</h3>
                  <div className="flex items-center gap-2">
                    {(['all','24h','7d','30d'] as const).map((w) => (
                      <button
                        key={w}
                        onClick={() => { setLbWindow(w); setPage(0) }}
                        className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${lbWindow===w ? 'bg-secondary/30 text-white border border-secondary/60' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                      >
                        {w === 'all' ? 'All-time' : w.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {lbLoading ? (
                    <p className="text-center text-white/80">Loading…</p>
                  ) : lbError ? (
                    <p className="text-center text-red-400">{lbError}</p>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-secondary/30 text-secondary">
                          <th className="p-3 font-semibold tracking-wider text-sm">Rank</th>
                          <th className="p-3 font-semibold tracking-wider text-sm">Player</th>
                          <th className="p-3 font-semibold tracking-wider text-sm text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/90">
                        {leaders.map((row) => (
                          <tr key={row.userId} className={`border-b border-white/10 hover:bg-white/5 ${row.userId === user?.id ? 'bg-secondary/10 border-y border-secondary/40' : ''}`}>
                            <td className="p-4 font-medium">{row.rank}</td>
                            <td className="p-4 font-medium">{row.username ?? 'Anonymous'}</td>
                            <td className="p-4 font-bold text-secondary text-right text-glow-magenta">{row.score}</td>
                          </tr>
                        ))}
                        {!leaders.length && (
                          <tr>
                            <td className="p-4 text-center text-white/60" colSpan={3}>No entries yet</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={!hasPrev || lbLoading}
                    className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${(!hasPrev || lbLoading) ? 'bg-white/5 text-white/40 cursor-not-allowed' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                  >
                    Prev
                  </button>
                  <div className="text-white/70 text-sm">
                    Page {page + 1} of {Math.max(1, Math.ceil(total / LIMIT))}
                  </div>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasNext || lbLoading}
                    className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${(!hasNext || lbLoading) ? 'bg-white/5 text-white/40 cursor-not-allowed' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                  >
                    Next
                  </button>
                </div>
              </div>
              </section>
            </div>
            )}

            {/* Footer (exact spacing like dashboard/home) */}
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
