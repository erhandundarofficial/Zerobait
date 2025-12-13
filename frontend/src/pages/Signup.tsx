import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function SignupPage() {
  const { register, user, logout } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await register(username.trim(), password, email.trim() || undefined)
      navigate('/')
    } catch (e: any) {
      setError(e?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-white">
      <div className="absolute inset-0 z-0 h-full w-full bg-transparent">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(0,255,255,0.2),transparent)]"></div>
      </div>

      <div className="layout-container z-10 flex h-full grow flex-col">
        <div className="flex flex-1 justify-center px-4 sm:px-10 md:px-20 lg:px-40 py-5">
          <div className="layout-content-container flex w-full max-w-[960px] flex-1 flex-col">
            {/* Header (same style as dashboard) */}
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

            {/* Centered Auth Card */}
            <main className="flex-grow flex flex-col justify-center items-center py-10 sm:py-20">
              <div className="w-full max-w-md p-8 bg-surface-dark/50 border border-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-glow-cyan">Sign Up</h1>
                  <p className="text-white/70 mt-2">Create an account to save your progress and appear on leaderboards.</p>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-white/80">Username</label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-white/50">person</span>
                      <input
                        className="form-input w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-white/80">Email (optional)</label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-white/50">mail</span>
                      <input
                        type="email"
                        className="form-input w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-white/80">Password</label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-white/50">lock</span>
                      <input
                        type="password"
                        className="form-input w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-white/80">Confirm Password</label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-white/50">lock</span>
                      <input
                        type="password"
                        className="form-input w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-black text-base font-bold leading-normal tracking-[0.015em] glow-cyan-soft transition-all hover:scale-105 disabled:opacity-70"
                  >
                    <span className="truncate">{loading ? 'Creating account…' : 'Sign Up'}</span>
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-white/60">
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold text-primary hover:underline">Log in</Link>
                  </p>
                </div>
              </div>
            </main>

            {/* Footer (same style as dashboard) */}
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
