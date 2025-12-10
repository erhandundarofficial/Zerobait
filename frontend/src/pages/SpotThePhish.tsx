import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

 type Difficulty = 'easy' | 'medium' | 'hard'
 type EmailItem = {
  id: string
  difficulty: Difficulty
  senderName: string
  senderEmail: string
  subject: string
  body: string
  isPhish: boolean
  explanation: string
 }

 const EMAILS: EmailItem[] = [
  // Easy
  {
    id: 'easy-safe-amazon',
    difficulty: 'easy',
    senderName: 'Amazon Support',
    senderEmail: 'support@amazon.com',
    subject: 'Your recent order has shipped',
    body:
      'Hello,\nYour package has been shipped and is on its way. You can track your order through your Amazon account.\nThank you for shopping with us.',
    isPhish: false,
    explanation: 'Legitimate sender domain amazon.com and no pressure tactics or credential requests.',
  },
  {
    id: 'easy-phish-amaz0n',
    difficulty: 'easy',
    senderName: 'Amaz0n Security',
    senderEmail: 'security-alert@amaz0n-support.co',
    subject: 'Your account will be closed in 24 hours!',
    body:
      'Dear user,\nWe detected unusual activity. Your account will be terminated unless you confirm your password.\nClick here: http://amaz0n-verify-login.com',
    isPhish: true,
    explanation: 'Typosquatted domains (amaz0n), urgency, and a request to confirm password via a non-Amazon link.',
  },
  // Medium
  {
    id: 'med-safe-uni',
    difficulty: 'medium',
    senderName: 'University IT Department',
    senderEmail: 'it-helpdesk@university.edu',
    subject: 'Scheduled maintenance notice',
    body:
      'Hello,\nOur network will undergo maintenance this Saturday between 1–4 PM.\nNo action is required.\nThank you,\nIT Support',
    isPhish: false,
    explanation: 'Legit .edu sender, neutral tone, and no links or credential requests.',
  },
  {
    id: 'med-phish-ms',
    difficulty: 'medium',
    senderName: 'Microsoft Alerts',
    senderEmail: 'noreply@m1crosoft-secure.net',
    subject: 'Password Expiring Today',
    body:
      'Your Microsoft password expires today.\nPlease renew immediately using the secure portal:\nhttps://microsoft-auth-update.com/login\n\nFailure to act may result in account suspension.',
    isPhish: true,
    explanation: 'Typosquatted sender (m1crosoft), off-domain URL, and urgency to act quickly.',
  },
  // Hard
  {
    id: 'hard-safe-dropbox',
    difficulty: 'hard',
    senderName: 'Dropbox Team',
    senderEmail: 'notifications@dropboxmail.com',
    subject: 'Shared folder updated',
    body:
      'Hi,\nA file in your shared folder “Project Team A” was updated.\nLog in through the official website if you’d like to review changes.\nBest regards,\nDropbox Notifications',
    isPhish: false,
    explanation: 'dropboxmail.com is a real domain used for Dropbox notifications; message is neutral and non-coercive.',
  },
  {
    id: 'hard-phish-paypal',
    difficulty: 'hard',
    senderName: 'PayPal Support',
    senderEmail: 'service@paypa1.com',
    subject: 'We detected a charge on your account',
    body:
      'Dear customer,\nWe noticed a $299 charge on your PayPal account.\nIf this wasn’t you, please dispute the charge immediately:\nhttps://paypal-resolution-center-secure.com\n\nFailure to respond may result in permanent account lock.',
    isPhish: true,
    explanation: 'Typosquatted domain (paypa1), alarming tone, and fake off-domain dispute link.',
  },
 ]

 export default function SpotThePhishPage() {
  const { user, logout, addScore } = useAuth()
  const navigate = useNavigate()

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<'safe' | 'phish' | null>(null)
  const [reveal, setReveal] = useState(false)
  const [score, setScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const current = EMAILS[idx]
  const total = EMAILS.length
  

  // Track correctness per difficulty
  const [correctByDifficulty, setCorrectByDifficulty] = useState<{ easy: number; medium: number; hard: number }>({ easy: 0, medium: 0, hard: 0 })

  function checkAndAwardIfLevelCompleted(newIdx: number) {
    // If we just completed 1 (easy), 3 (medium), or 5 (hard)
    if (newIdx === 2 || newIdx === 4 || newIdx === 6) {
      const diff: Difficulty = newIdx === 2 ? 'easy' : newIdx === 4 ? 'medium' : 'hard'
      const passed = correctByDifficulty[diff] >= 2
      if (user?.id) {
        ;(async () => {
          try {
            setSubmitting(true)
            const res = await fetch('http://localhost:4000/api/games/spot-the-phish/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ difficulty: diff, userId: user.id, passed }),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
              const delta = typeof data.awardedDelta === 'number' ? data.awardedDelta : 0
              if (delta > 0) addScore(delta)
            }
          } catch {}
          finally { setSubmitting(false) }
        })()
      }
    }
  }

  function onChoose(choice: 'safe' | 'phish') {
    if (reveal) return
    setSelected(choice)
    const correct = (choice === 'phish') === current.isPhish
    setReveal(true)
    if (correct) {
      setScore((s) => s + 1)
      setCorrectByDifficulty((prev) => ({ ...prev, [current.difficulty]: prev[current.difficulty] + 1 }))
    }
  }

  function onNext() {
    if (!reveal) return
    const nextIdx = idx + 1
    checkAndAwardIfLevelCompleted(nextIdx)
    if (nextIdx >= total) {
      navigate('/games')
      return
    }
    setIdx(nextIdx)
    setSelected(null)
    setReveal(false)
  }

  function difficultyBadge(d: Difficulty) {
    return <span className="text-[10px] uppercase rounded-md bg-white/10 px-2 py-1 text-white/70">{d}</span>
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(0,255,255,0.15),transparent)]"></div>
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
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary font-bold uppercase tracking-wider text-glow-cyan">Spot the Phish!</p>
                  <h1 className="text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.03em]">Decide: Safe or Phishing</h1>
                  <p className="text-white/70 mt-2 max-w-2xl">Read the email details and choose. Get explanations after each answer.</p>
                </div>
                <Link to="/games" className="text-sm font-bold text-primary hover:text-white transition-colors">Back</Link>
              </div>

              <div className="flex items-center justify-between text-sm text-white/70">
                <div className="flex items-center gap-2">{difficultyBadge(current.difficulty)}</div>
                <div>Question {idx + 1} / {total}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 divide-y divide-white/10">
                <div className="p-4 sm:p-5 flex flex-col gap-1">
                  <div className="text-white font-semibold">From: <span className="text-white/90">{current.senderName}</span></div>
                  <div className="font-mono text-white/80">{current.senderEmail}</div>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="text-white font-semibold">Subject: <span className="text-white/90">{current.subject}</span></div>
                  <pre className="mt-3 whitespace-pre-wrap text-white/80 font-sans">{current.body}</pre>
                </div>
              </div>

              {!reveal ? (
                <div className="flex gap-3">
                  <button disabled={submitting} onClick={() => onChoose('safe')} className="h-10 px-4 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold hover:bg-emerald-500/30">Safe Email</button>
                  <button disabled={submitting} onClick={() => onChoose('phish')} className="h-10 px-4 rounded-md bg-red-500/20 border border-red-400/40 text-red-200 font-bold hover:bg-red-500/30">Phishing Attempt</button>
                </div>
              ) : (
                <div className={`rounded-xl border p-5 ${((selected === 'phish') === current.isPhish) ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-red-400/40 bg-red-500/10'}`}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">{((selected === 'phish') === current.isPhish) ? 'check_circle' : 'error'}</span>
                    <div className="font-bold">{((selected === 'phish') === current.isPhish) ? 'Correct!' : 'Not quite.'}</div>
                  </div>
                  <div className="mt-2 text-white/80 text-sm">{current.explanation}</div>
                  <div className="mt-4">
                    <button onClick={onNext} className="h-10 px-4 rounded-md bg-primary text-black font-bold">{idx + 1 >= total ? 'Finish' : 'Next'}</button>
                  </div>
                </div>
              )}

              <div className="text-sm text-white/70">Score: <span className="text-white font-semibold">{score}</span> / {total}</div>
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
