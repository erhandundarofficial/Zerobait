import { useMemo, useState } from 'react'
import type React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

// Types
type Difficulty = 'easy' | 'medium' | 'hard'

type Piece = {
  id: string
  label: string
  sample: string
  // No visible good/bad separation; keep internal hints for logic only
  classHint?: 'lower' | 'upper' | 'digit' | 'symbol' | 'trap_personal' | 'trap_sequence'
}

function shuffleArray<T>(array: T[]): T[] {
  const a = array.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

// Level-specific piece sets (mixed; user isn't warned visually)
const DIFFICULTY_PIECES: Record<Difficulty, Piece[]> = {
  easy: [
    { id: 'e-lc-1', label: 'Letters', sample: 'aer', classHint: 'lower' },
    { id: 'e-uc-1', label: 'Letters', sample: 'ASD', classHint: 'upper' },
    { id: 'e-dg-1', label: 'Numbers', sample: '158', classHint: 'digit' },
    { id: 'e-sb-1', label: 'Symbols', sample: '!@#', classHint: 'symbol' },
    { id: 'e-pi-1', label: 'Name', sample: 'Ayse', classHint: 'trap_personal' },
    { id: 'e-sq-1', label: 'Seq', sample: '12345', classHint: 'trap_sequence' },
  ],
  medium: [
    { id: 'm-lc-1', label: 'Letters', sample: 'mnt', classHint: 'lower' },
    { id: 'm-uc-1', label: 'Letters', sample: 'QXZ', classHint: 'upper' },
    { id: 'm-dg-1', label: 'Numbers', sample: '274', classHint: 'digit' },
    { id: 'm-sb-1', label: 'Symbols', sample: '$%_', classHint: 'symbol' },
    { id: 'm-lc-2', label: 'Letters', sample: 'eir', classHint: 'lower' },
    { id: 'm-uc-2', label: 'Letters', sample: 'NPT', classHint: 'upper' },
    { id: 'm-pi-1', label: 'Personal', sample: '1990', classHint: 'trap_personal' },
    { id: 'm-sq-1', label: 'Seq', sample: 'qwert', classHint: 'trap_sequence' },
  ],
  hard: [
    { id: 'h-lc-1', label: 'Letters', sample: 'zvk', classHint: 'lower' },
    { id: 'h-uc-1', label: 'Letters', sample: 'RLH', classHint: 'upper' },
    { id: 'h-dg-1', label: 'Numbers', sample: '906', classHint: 'digit' },
    { id: 'h-sb-1', label: 'Symbols', sample: '#@!', classHint: 'symbol' },
    { id: 'h-lc-2', label: 'Letters', sample: 'bqj', classHint: 'lower' },
    { id: 'h-uc-2', label: 'Letters', sample: 'YWK', classHint: 'upper' },
    { id: 'h-dg-2', label: 'Numbers', sample: '347', classHint: 'digit' },
    { id: 'h-sb-2', label: 'Symbols', sample: '+*=', classHint: 'symbol' },
    { id: 'h-pi-1', label: 'Personal', sample: 'birthdate', classHint: 'trap_personal' },
    { id: 'h-sq-1', label: 'Seq', sample: 'abc123', classHint: 'trap_sequence' },
  ],
}

function humanizeDurationFromLog10Seconds(log10Seconds: number): string {
  // Convert 10^x seconds into readable units
  const seconds = Math.pow(10, Math.min(log10Seconds, 20)) // cap for safety rendering
  if (log10Seconds < 1) return `${(seconds).toFixed(2)}s`
  const minutes = seconds / 60
  if (minutes < 60) return `${minutes.toFixed(2)}m`
  const hours = minutes / 60
  if (hours < 48) return `${hours.toFixed(2)}h`
  const days = hours / 24
  if (days < 365) return `${days.toFixed(2)}d`
  const years = days / 365
  if (years < 1e3) return `${years.toFixed(2)}y`
  const thousand = years / 1e3
  if (thousand < 1e6) return `${thousand.toFixed(2)}K Years`
  const million = thousand / 1e3
  if (million < 1e3) return `${million.toFixed(2)} Million Years`
  const billion = million / 1e3
  return `${billion.toFixed(2)} Billion Years`
}

function estimateCrackLog10Seconds(password: string, traps: { personal: number; sequence: number }) {
  // Character pool size detection
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSymbol = /[^a-zA-Z0-9]/.test(password)

  let pool = 0
  if (hasLower) pool += 26
  if (hasUpper) pool += 26
  if (hasDigit) pool += 10
  if (hasSymbol) pool += 33 // rough set
  if (pool === 0) return -Infinity

  const len = password.length
  // Baseline attacker speed (guesses/sec)
  const gps = 1e10 // 10B guesses/sec

  // log10(guesses) = len * log10(pool)
  let log10Guesses = len * Math.log10(pool)

  // Apply penalties for traps (reduce effective entropy)
  const penaltyFactor = Math.max(0.2, 1 - traps.personal * 0.4 - traps.sequence * 0.3)
  log10Guesses *= penaltyFactor

  // time (seconds) ~ guesses / gps -> log10(time) = log10Guesses - log10(gps)
  const log10Seconds = log10Guesses - Math.log10(gps)
  return log10Seconds
}

function targetLog10SecondsFor(d: Difficulty): { label: string; log10: number } {
  switch (d) {
    case 'easy':
      return { label: '1 Year', log10: Math.log10(60 * 60 * 24 * 365) }
    case 'medium':
      return { label: '1 Million Years', log10: Math.log10(60 * 60 * 24 * 365 * 1e6) }
    case 'hard':
    default:
      return { label: '1 Billion Years', log10: Math.log10(60 * 60 * 24 * 365 * 1e9) }
  }
}

const LEVEL_REQUIREMENTS: Record<Difficulty, string[]> = {
  easy: [
    'Min 8 characters',
    'Include at least 3 of: Uppercase, Lowercase, Number, Symbol',
  ],
  medium: [
    'Min 12 characters',
    'Include Uppercase, Lowercase, Number, Symbol',
  ],
  hard: [
    'Min 16 characters',
    'Include Uppercase, Lowercase, Number, Symbol',
    'Avoid common sequences and personal info',
  ],
}

export default function PasswordPuzzlePage() {
  const { user, logout, addScore } = useAuth()
  const navigate = useNavigate()

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [selectedPieces, setSelectedPieces] = useState<string[]>([])
  const [shuffleKey, setShuffleKey] = useState(0)
  const [finishing, setFinishing] = useState(false)

  const pieces = useMemo(() => (difficulty ? DIFFICULTY_PIECES[difficulty] : []), [difficulty])
  const shuffledPieces = useMemo(() => shuffleArray(pieces), [pieces, shuffleKey])
  const pieceById = useMemo(() => Object.fromEntries(pieces.map(p => [p.id, p])), [pieces])

  const password = useMemo(() => selectedPieces.map(id => pieceById[id]?.sample || '').join(''), [selectedPieces, pieceById])
  const traps = useMemo(() => {
    let personal = 0
    let sequence = 0
    selectedPieces.forEach(id => {
      const p = pieceById[id]
      if (!p) return
      if (p.classHint === 'trap_personal') personal += 1
      if (p.classHint === 'trap_sequence') sequence += 1
    })
    return { personal, sequence }
  }, [selectedPieces, pieceById])

  const log10Seconds = useMemo(() => estimateCrackLog10Seconds(password, traps), [password, traps])
  const target = useMemo(() => (difficulty ? targetLog10SecondsFor(difficulty) : null), [difficulty])
  const meetsTarget = useMemo(() => (target ? log10Seconds > target.log10 : false), [log10Seconds, target])

  function onDragStart(id: string, e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  function onDropPassword(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    setSelectedPieces(prev => [...prev, id])
  }

  function removePiece(idx: number) {
    setSelectedPieces(prev => prev.filter((_, i) => i !== idx))
  }

  function reset() {
    setSelectedPieces([])
    setShuffleKey((k) => k + 1)
  }

  function scoreForLevel(d: Difficulty): number {
    switch (d) {
      case 'easy':
        return 50
      case 'medium':
        return 100
      case 'hard':
      default:
        return 200
    }
  }

  async function finishGame() {
    if (!difficulty || finishing) return
    setFinishing(true)
    try {
      if (user?.id) {
        const res = await fetch('http://localhost:4000/api/games/password-puzzle/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ difficulty, userId: user.id }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          const delta = typeof data.awardedDelta === 'number' ? data.awardedDelta : 0
          if (delta > 0) addScore(delta)
        }
      }
    } finally {
      setFinishing(false)
      navigate('/games')
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-white">
      {/* Background grid overlay (purple) */}
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

            {/* Content */}
            <div className="space-y-6">
              {/* Pre-start Level Selection */}
              {!difficulty && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-secondary font-bold uppercase tracking-wider text-glow-magenta">Password Security Puzzle</p>
                      <h1 className="text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.03em]">Choose your level</h1>
                      <p className="text-white/70 mt-2 max-w-2xl">Pick a challenge and aim to exceed the target time to crack.</p>
                    </div>
                    <Link to="/games" className="text-sm font-bold text-secondary hover:text-white transition-colors">Back</Link>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {(['easy','medium','hard'] as Difficulty[]).map((d) => (
                      <div key={d} className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-bold">{d.charAt(0).toUpperCase()+d.slice(1)}</h3>
                          <span className="text-xs px-2 py-1 rounded-md bg-white/10 text-white/80">Target: {targetLog10SecondsFor(d).label}</span>
                        </div>
                        <ul className="text-sm text-white/80 space-y-1">
                          {LEVEL_REQUIREMENTS[d].map((req, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => { setSelectedPieces([]); setDifficulty(d); setShuffleKey((k) => k + 1) }}
                          className="mt-2 flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-black hover:bg-primary/90 transition-colors"
                        >
                          Start {d.charAt(0).toUpperCase()+d.slice(1)}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gameplay */}
              {difficulty && (
                <>
                  {/* Hero with Back */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-secondary font-bold uppercase tracking-wider text-glow-magenta">Password Security Puzzle</p>
                      <h1 className="text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.03em]">Build a password that lasts</h1>
                      <p className="text-white/70 mt-2 max-w-2xl">Drag pieces into the Password Box. Avoid hidden traps and push your time-to-crack above the target.</p>
                    </div>
                    <Link to="/games" className="text-sm font-bold text-secondary hover:text-white transition-colors">Back</Link>
                  </div>

                  {/* Level requirements & Target */}
                  <div className="rounded-xl border border-secondary/30 bg-white/5 p-5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <span className="material-symbols-outlined text-secondary">flag</span>
                        <span className="text-white/70">Target Time to Crack:</span>
                        <span className="text-secondary font-bold text-glow-magenta">{target?.label}</span>
                      </div>
                    </div>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {LEVEL_REQUIREMENTS[difficulty].map((req, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-white/90 text-sm">
                          <span className="material-symbols-outlined text-secondary">check_circle</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Feedback */}
                  <div className="rounded-xl border border-white/20 bg-white/5 p-5 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[220px]">
                      <div className="text-sm text-white/70">Estimated Time to Crack</div>
                      <div className={`text-2xl font-black ${meetsTarget? 'text-secondary text-glow-magenta' : 'text-white'}`}>
                        {Number.isFinite(log10Seconds) ? humanizeDurationFromLog10Seconds(log10Seconds) : '—'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={reset} className="h-10 px-4 rounded-md bg-white/10 hover:bg-white/20 text-sm font-semibold">Reset</button>
                    </div>
                  </div>

                  {/* Password Box (Drop Zone) */}
                  <div>
                    <div
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
                      onDrop={onDropPassword}
                      className="rounded-xl border border-secondary/40 bg-white/5 p-4 min-h-[100px] flex flex-wrap items-center gap-2"
                    >
                      {selectedPieces.length === 0 && (
                        <span className="text-white/60 text-sm">Drag pieces here to build your password…</span>
                      )}
                      {selectedPieces.map((id, idx) => {
                        const p = pieceById[id]
                        return (
                          <span key={`${id}-${idx}`} className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm border border-white/15 bg-white/10">
                            <span className="font-mono tracking-wide">{p?.sample}</span>
                            <button onClick={() => removePiece(idx)} className="text-white/70 hover:text-white">
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </span>
                        )
                      })}
                    </div>
                    <div className="mt-2 text-sm text-white/70">
                      Password preview: <span className="font-mono text-white/90">{password || '—'}</span>
                    </div>
                  </div>

                  {/* Pieces Palette (single mixed list) */}
                  <div>
                    <h3 className="text-white font-bold mb-2">Pieces</h3>
                    <div className="flex flex-wrap gap-2">
                      {shuffledPieces.map(p => (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={(e) => onDragStart(p.id, e)}
                          className="cursor-grab active:cursor-grabbing select-none rounded-md border border-white/15 bg-white/10 px-3 py-1 text-sm"
                          title={p.label}
                        >
                          <span className="font-mono tracking-wide">{p.sample}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Win Condition Banner */}
                  <div className={`rounded-xl border p-5 ${meetsTarget ? 'border-secondary/40 bg-secondary/10' : 'border-white/10 bg-white/5'}`}>
                    {meetsTarget ? (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3 text-secondary text-glow-magenta">
                          <span className="material-symbols-outlined">trophy</span>
                          <div className="font-bold">Great job! Your password exceeds the target cracking time.</div>
                        </div>
                        <button
                          onClick={finishGame}
                          disabled={finishing}
                          className="h-10 px-4 rounded-md bg-primary text-black font-bold disabled:opacity-70"
                        >
                          {finishing ? 'Finishing…' : 'Finish'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-white/80">
                        <span className="material-symbols-outlined">hourglass_top</span>
                        <div className="font-bold">Keep going—add more variety and length to increase time to crack.</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

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
