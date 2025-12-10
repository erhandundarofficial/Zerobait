import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

 type Difficulty = 'easy' | 'medium' | 'hard'

 type DomainItem = { id: string; name: string; isCorrect: boolean }

 function shuffle<T>(arr: T[]): T[] { const a = arr.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }

 function domainsFor(d: Difficulty): DomainItem[] {
  if (d === 'easy') {
    return shuffle([
      { id: 'r-google', name: 'google.com', isCorrect: true },
      { id: 'r-youtube', name: 'youtube.com', isCorrect: true },
      { id: 'r-amazon', name: 'amazon.com', isCorrect: true },
      { id: 'r-instagram', name: 'instagram.com', isCorrect: true },
      { id: 'f-g00gle', name: 'g00gle.com', isCorrect: false },
      { id: 'f-gooqle', name: 'gooqle.com', isCorrect: false },
      { id: 'f-y0utube', name: 'y0utube.co', isCorrect: false },
      { id: 'f-instagrarn', name: 'instagrarn.com', isCorrect: false },
    ])
  }
  if (d === 'medium') {
    return shuffle([
      { id: 'r-wikipedia', name: 'wikipedia.org', isCorrect: true },
      { id: 'r-discord', name: 'discord.com', isCorrect: true },
      { id: 'r-github', name: 'github.com', isCorrect: true },
      { id: 'r-twitter', name: 'twitter.com', isCorrect: true },
      { id: 'f-disc0rd', name: 'disc0rd.com', isCorrect: false },
      { id: 'f-twltter', name: 'twltter.com', isCorrect: false },
      { id: 'f-wikipediia', name: 'wikipediia.org', isCorrect: false },
      { id: 'f-githab', name: 'githab.com', isCorrect: false },
    ])
  }
  // hard
  return shuffle([
    { id: 'r-cloudflare', name: 'cloudflare.com', isCorrect: true },
    { id: 'r-protonmail', name: 'protonmail.com', isCorrect: true },
    { id: 'r-blockchain', name: 'blockchain.com', isCorrect: true },
    { id: 'r-openai', name: 'openai.com', isCorrect: true },
    { id: 'f-cIoudflare', name: 'cIoudflare.com', isCorrect: false }, // I instead of l
    { id: 'f-0penai', name: '0penai.com', isCorrect: false }, // 0 instead of o
    { id: 'f-blockcharn', name: 'blockcharn.com', isCorrect: false }, // rn instead of m
    { id: 'f-protonmaii', name: 'protonmaii.com', isCorrect: false }, // ii instead of il
  ])
 }

 export default function DomainDetectivePage() {
  const { user, logout, addScore } = useAuth()
  const navigate = useNavigate()

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [items, setItems] = useState<DomainItem[]>([])
  const [selectedCorrect, setSelectedCorrect] = useState<string[]>([])
  const [selectedWrong, setSelectedWrong] = useState<string[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const maxCorrect = 4
  const complete = selectedCorrect.length >= maxCorrect

  function startLevel(d: Difficulty) {
    setDifficulty(d)
    setItems(domainsFor(d))
    setSelectedCorrect([])
    setSelectedWrong([])
    setFeedback(null)
  }

  function cardState(id: string): 'neutral' | 'right' | 'wrong' {
    if (selectedCorrect.includes(id)) return 'right'
    if (selectedWrong.includes(id)) return 'wrong'
    return 'neutral'
  }

  function onClickItem(it: DomainItem) {
    if (complete) return
    if (selectedCorrect.includes(it.id) || selectedWrong.includes(it.id)) return
    if (it.isCorrect) {
      if (selectedCorrect.length >= maxCorrect) return
      setSelectedCorrect((prev) => [...prev, it.id])
    } else {
      setSelectedWrong((prev) => [...prev, it.id])
      setFeedback('This is a phishing domain!')
      setTimeout(() => setFeedback(null), 1500)
    }
  }

  function nextOf(d: Difficulty): Difficulty | null {
    return d === 'easy' ? 'medium' : d === 'medium' ? 'hard' : null
  }

  async function awardAndNext() {
    if (!difficulty) return
    // Award points once per difficulty when authenticated
    if (user?.id) {
      try {
        setSubmitting(true)
        const res = await fetch('http://localhost:4000/api/games/domain-detective/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ difficulty, userId: user.id }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          const delta = typeof data.awardedDelta === 'number' ? data.awardedDelta : 0
          if (delta > 0) addScore(delta)
        }
      } catch {}
      finally {
        setSubmitting(false)
      }
    }
    const nxt = nextOf(difficulty)
    if (nxt) startLevel(nxt)
    else navigate('/games')
  }

  function badge(d: Difficulty) {
    return <span className="text-[10px] uppercase rounded-md bg-white/10 px-2 py-1 text-white/70">{d}</span>
  }

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
                      <button onClick={() => { logout(); navigate('/') }} className="flex h-9 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-white/10 px-3 text-xs font-semibold leading-normal text-gray-200 transition-colors hover:bg-white/20">Log out</button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <div className="space-y-6">
              {!difficulty && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-secondary font-bold uppercase tracking-wider text-glow-magenta">Domain Detective</p>
                      <h1 className="text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.03em]">Choose your level</h1>
                      <p className="text-white/70 mt-2 max-w-2xl">Click all real domains in each level. Avoid the phishing look-alikes.</p>
                    </div>
                    <Link to="/games" className="text-sm font-bold text-secondary hover:text-white transition-colors">Back</Link>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {(['easy','medium','hard'] as Difficulty[]).map((d) => (
                      <div key={d} className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-bold">{d.charAt(0).toUpperCase()+d.slice(1)}</h3>
                          {badge(d)}
                        </div>
                        <p className="text-sm text-white/70">Identify 4 real domains among 8 cards.</p>
                        <button onClick={() => startLevel(d)} className="mt-2 flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-black hover:bg-primary/90 transition-colors">
                          Start {d.charAt(0).toUpperCase()+d.slice(1)}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {difficulty && (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-secondary font-bold uppercase tracking-wider text-glow-magenta">Domain Detective</p>
                      <h1 className="text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.03em]">Find the real domains</h1>
                      <p className="text-white/70 mt-2 max-w-2xl">Select only the 4 legitimate domains.</p>
                    </div>
                    <Link to="/games" className="text-sm font-bold text-secondary hover:text-white transition-colors">Back</Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {items.map((it) => {
                      const st = cardState(it.id)
                      const base = 'rounded-xl border p-4 text-center font-mono text-white/90 cursor-pointer select-none transition-colors'
                      const cls = st === 'right' ? 'border-emerald-400/50 bg-emerald-500/10' : st === 'wrong' ? 'border-red-400/50 bg-red-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                      return (
                        <div key={it.id} className={`${base} ${cls}`} onClick={() => onClickItem(it)}>
                          {it.name}
                        </div>
                      )
                    })}
                  </div>

                  {feedback && (
                    <div className="text-sm text-red-300 mt-2">{feedback}</div>
                  )}

                  <div className="mt-4 text-white/80 text-sm">Correct selected: <span className="text-white font-semibold">{selectedCorrect.length}</span>/4</div>

                  <div className={`mt-6 rounded-xl border p-5 ${complete ? 'border-secondary/40 bg-secondary/10' : 'border-white/10 bg-white/5'}`}>
                    {complete ? (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3 text-secondary text-glow-magenta">
                          <span className="material-symbols-outlined">verified</span>
                          <div className="font-bold">Level complete! Great job spotting the real domains.</div>
                        </div>
                        <button onClick={awardAndNext} disabled={submitting} className="h-10 px-4 rounded-md bg-primary text-black font-bold disabled:opacity-70">
                          {nextOf(difficulty!) ? (submitting ? 'Continuing…' : 'Next Level') : (submitting ? 'Finishing…' : 'Finish')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-white/80">
                        <span className="material-symbols-outlined">tips_and_updates</span>
                        <div className="font-bold">Tip: Watch for number/letter swaps like 0↔o, l↔I, rn↔m.</div>
                      </div>
                    )}
                  </div>
                </>
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
