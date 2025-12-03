import { useState } from 'react'
import { Link } from 'react-router-dom'

export type ScanVerdict = 'SAFE' | 'WARNING' | 'UNKNOWN' | 'COMMUNITY_REPORTED'

export type ScanResponse = {
  url: string
  normalizedUrl: string
  verdict: ScanVerdict
  reasons: string[]
  reportCount: number
}

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [isReporting, setIsReporting] = useState(false)
  const [reportMessage, setReportMessage] = useState<string | null>(null)

  async function handleScan() {
    setScanError(null)
    setReportMessage(null)
    const trimmed = url.trim()
    if (!trimmed) {
      setScanError('Please enter a URL to scan.')
      return
    }
    setIsScanning(true)
    try {
      const response = await fetch('http://localhost:4000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setScanError((data as any).error || 'Failed to scan URL.')
        setScanResult(null)
      } else {
        const data = (await response.json()) as ScanResponse
        setScanResult(data)
      }
    } catch {
      setScanError('Network error while scanning URL.')
      setScanResult(null)
    } finally {
      setIsScanning(false)
    }
  }

  async function handleReport() {
    if (!scanResult) return
    setIsReporting(true)
    setReportMessage(null)
    try {
      const response = await fetch('http://localhost:4000/api/report-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scanResult.url }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !(data as any).success) {
        setReportMessage((data as any).error || 'Failed to report URL.')
        return
      }
      setReportMessage('Thanks for your report!')
      setScanResult((current) =>
        current ? { ...current, reportCount: (data as any).reportCount ?? current.reportCount } : current,
      )
    } catch {
      setReportMessage('Network error while reporting URL.')
    } finally {
      setIsReporting(false)
    }
  }

  const verdictColorClasses: Record<ScanVerdict, string> = {
    SAFE: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    WARNING: 'border-red-500/30 bg-red-500/10 text-red-300',
    UNKNOWN: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    COMMUNITY_REPORTED: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  }
  const isIdle = !scanResult
  const currentVerdict = scanResult?.verdict as ScanVerdict | undefined
  const resultCardClasses = isIdle
    ? 'border-white/20 bg-white/5 text-gray-200'
    : verdictColorClasses[currentVerdict!]
  const resultIcon = isIdle
    ? 'help'
    : currentVerdict === 'WARNING'
      ? 'gpp_bad'
      : currentVerdict === 'COMMUNITY_REPORTED'
        ? 'flag'
        : 'verified_user'
  const resultTitle = isIdle
    ? 'READY TO SCAN'
    : currentVerdict === 'SAFE'
      ? 'SAFE'
      : currentVerdict === 'WARNING'
        ? 'WARNING'
        : currentVerdict === 'UNKNOWN'
          ? 'CHECK CAREFULLY'
          : 'COMMUNITY REPORTED'

  // Separate Google Safe Browsing reason for special styling
  const gsbReason = scanResult?.reasons.find((r) => r.toLowerCase().includes('google safe browsing'))
  const otherReasons = (scanResult?.reasons || []).filter(
    (r) => !r.toLowerCase().includes('google safe browsing'),
  )

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-white">

      <div className="absolute inset-0 z-0 h-full w-full bg-transparent">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(0,255,255,0.2),transparent)]"></div>
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
                  <Link className="text-white/80 hover:text-white transition-colors text-sm font-bold leading-normal px-4 py-2 rounded-md hover:bg-white/10" to="/login">Log In</Link>
                  <Link className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-4 bg-primary text-black hover:bg-primary/90 transition-all duration-300 text-sm font-bold leading-normal tracking-[0.015em]" to="/signup">
                    <span className="truncate">Sign Up</span>
                  </Link>
                </div>
              </div>
            </header>

            <main className="flex-grow flex flex-col justify-center">
              <div className="py-10 sm:py-20">
                <div className="xs:p-4">
                  <div className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat xs:gap-8 items-center justify-center p-4">
                    <div className="flex flex-col gap-2 text-center">
                      <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] xs:text-5xl xs:leading-tight xs:tracking-[-0.033em]">
                        Scan URL for Phishing Threats
                      </h1>
                      <h2 className="text-white/70 text-sm font-normal leading-normal xs:text-base xs:leading-normal">
                        Enter a URL below to check for potential phishing threats in real-time.
                      </h2>
                    </div>
                    <div className="w-full max-w-[600px] flex flex-col items-center gap-6">
                      <label className="flex flex-col min-w-40 h-14 w-full xs:h-16">
                        <div className="relative flex w-full flex-1 items-stretch h-full">
                          <div className="absolute inset-0 rounded-lg bg-black/30 border border-white/10 glow-cyan opacity-25"></div>
                          <div className="relative text-white/50 flex bg-transparent items-center justify-center pl-4 rounded-l-lg z-10">
                            <span className="material-symbols-outlined">link</span>
                          </div>
                          <input
                            className="relative z-10 flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-none text-white focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-white/50 px-4 text-sm xs:text-base"
                            placeholder="Enter URL to scan (e.g., https://example.com)"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                          />
                        </div>
                      </label>
                      <button
                        onClick={handleScan}
                        className="flex min-w-[200px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-black text-base font-bold leading-normal tracking-[0.015em] glow-cyan transition-all hover:scale-105 disabled:opacity-60"
                        disabled={isScanning}
                      >
                        <span className="truncate">{isScanning ? 'Scanning…' : 'Scan Now'}</span>
                      </button>

                      {/* Result Card */}
                      <div className="w-full">
                        <div
                          className={`flex flex-col items-center gap-6 rounded-xl border p-6 text-center sm:p-8 ${resultCardClasses}`}
                        >
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                            <span className="material-symbols-outlined text-4xl">{resultIcon}</span>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-bold">{resultTitle}</h3>
                            <p className="text-white/90">
                              {scanResult
                                ? `Reports: ${scanResult.reportCount} • URL: ${scanResult.normalizedUrl}`
                                : 'Scan a URL to see results from the Zerobait engine.'}
                            </p>
                            {scanResult && gsbReason && (
                              <p className="text-white/90">{gsbReason}</p>
                            )}
                            {scanResult && otherReasons.length > 0 && (
                              <ul className="mt-2 list-disc space-y-1 text-left text-sm text-white/90">
                                {otherReasons.map((reason) => (
                                  <li key={reason}>{reason}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Report text link (only after a scan) */}
                      {scanResult && (
                        <button
                          onClick={handleReport}
                          disabled={isReporting}
                          className="group mt-8 flex cursor-pointer items-center gap-2 text-secondary transition-colors duration-300 hover:text-white"
                        >
                          <span className="material-symbols-outlined text-secondary group-hover:text-white transition-colors duration-300">flag</span>
                          <span className="text-sm font-bold tracking-wide underline decoration-dotted underline-offset-4">Report this URL</span>
                        </button>
                      )}
                      {reportMessage && <p className="mt-2 text-sm text-white/80">{reportMessage}</p>}
                    </div>
                    {scanError && <p className="mt-2 text-sm text-red-400">{scanError}</p>}
                  </div>
                </div>
              </div>
            </main>

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
