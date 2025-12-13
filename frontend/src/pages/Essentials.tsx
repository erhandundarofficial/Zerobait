import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

type GameListItem = {
  key: string
  title: string
  description: string
  type: string
  difficulty: 'easy' | 'medium' | 'hard'
}

const GROUPED_KEYS = [
  'url_detective',
  'social_sleuth',
  'password_fortress',
  'email_interceptor',
  '2fa_guardian',
] as const

export default function EssentialsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
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
        if (alive) setGames((data.games || []) as GameListItem[])
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load games')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  const essentials = games.filter(g => GROUPED_KEYS.includes(g.key as any))

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(255,0,255,0.15),transparent)]"></div>
      </div>

      <div className="layout-container z-10 flex h-full grow flex-col">
        <div className="flex flex-1 justify-center px-4 sm:px-10 md:px-20 lg:px-40 py-5">
          <div className="layout-content-container flex w-full max-w-[960px] flex-1 flex-col">
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
                        onClick={() => { logout(); navigate('/') }}
                        className="flex h-9 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-white/10 px-3 text-xs font-semibold leading-normal text-gray-200 transition-colors hover:bg-white/20"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-secondary font-bold uppercase tracking-wider text-glow-magenta">Phishing Essentials</p>
                  <h1 className="text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.03em]">Choose a core skill</h1>
                  <p className="text-white/70 mt-2 max-w-2xl">Five foundational challenges to sharpen your instincts: URLs, social tricks, passwords, email clues, and 2FA safety.</p>
                </div>
                <Link to="/games" className="text-sm font-bold text-secondary hover:text-white transition-colors">Back</Link>
              </div>

              {loading && <p className="mt-4 text-white/80">Loading…</p>}
              {error && <p className="mt-4 text-red-400">{error}</p>}

              {!loading && !error && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {essentials.map((g) => (
                    <Link
                      key={g.key}
                      to={`/games/${g.key}`}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-white/90 transition-all hover:bg-secondary/10 hover:border-secondary/40"
                    >
                      <span className="material-symbols-outlined text-secondary">
                        {g.key.includes('url') ? 'link' : g.key.includes('social') ? 'group' : g.key.includes('password') ? 'password' : g.key.includes('email') ? 'mail' : 'verified_user'}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{g.title}</p>
                        <p className="text-xs text-white/70 line-clamp-2">{g.description}</p>
                      </div>
                      <span className="text-[10px] uppercase rounded-md bg-white/10 px-2 py-1 text-white/70">{g.difficulty}</span>
                      <span className="material-symbols-outlined text-white/60">chevron_right</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

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
