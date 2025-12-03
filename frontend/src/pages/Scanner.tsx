import { useState } from 'react'

export type ScanVerdict = 'SAFE' | 'WARNING' | 'UNKNOWN' | 'COMMUNITY_REPORTED'

export type ScanResponse = {
  url: string
  normalizedUrl: string
  verdict: ScanVerdict
  reasons: string[]
  reportCount: number
}

export default function ScannerPage() {
  const [url, setUrl] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null)
  const [isReporting, setIsReporting] = useState(false)
  const [reportMessage, setReportMessage] = useState<string | null>(null)

  async function handleScan(e: React.FormEvent) {
    e.preventDefault()
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
        setScanError(data.error || 'Failed to scan URL.')
        setScanResult(null)
        return
      }

      const data = (await response.json()) as ScanResponse
      setScanResult(data)
    } catch (error) {
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
      if (!response.ok || !data.success) {
        setReportMessage(data.error || 'Failed to report URL.')
        return
      }

      setReportMessage('Thanks for your report!')
      setScanResult((current) =>
        current ? { ...current, reportCount: data.reportCount ?? current.reportCount } : current,
      )
    } catch (error) {
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

  const currentVerdict = scanResult?.verdict ?? 'SAFE'

  return (
    <div className="w-full max-w-3xl">
      <div className="text-center">
        <h1 className="text-white text-4xl font-bold leading-tight tracking-tighter sm:text-5xl lg:text-6xl">
          Scan URL for Phishing Threats
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-normal leading-normal text-gray-300 sm:text-lg">
          Enter a URL below to check for potential phishing threats in real-time.
        </p>
      </div>

      <div className="mt-10 sm:mt-12">
        <form className="flex w-full flex-col items-center gap-4 sm:flex-row" onSubmit={handleScan}>
          <div className="relative w-full flex-grow">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <span className="material-symbols-outlined text-gray-400">link</span>
            </div>
            <input
              className="h-14 w-full min-w-0 flex-1 rounded-xl border border-white/10 bg-gray-900 p-4 pl-12 text-base font-normal leading-normal text-gray-100 placeholder:text-gray-500 focus:border-emerald-400 focus:outline-0 focus:ring-2 focus:ring-emerald-400/50"
              placeholder="Enter URL to scan (e.g., https://example.com)"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <button
            className="flex h-14 w-full shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-emerald-400 px-8 text-base font-bold leading-normal text-gray-900 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            type="submit"
            disabled={isScanning}
          >
            <span className="truncate">{isScanning ? 'Scanning…' : 'Scan Now'}</span>
          </button>
        </form>
        {scanError && <p className="mt-3 text-sm text-red-400 text-center">{scanError}</p>}
      </div>

      <div className="mt-10 sm:mt-16">
        <div
          className={`flex flex-col items-center gap-6 rounded-xl border p-6 text-center sm:p-8 ${verdictColorClasses[currentVerdict]}`}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <span className="material-symbols-outlined text-4xl">
              {currentVerdict === 'WARNING' ? 'gpp_bad' : 'verified_user'}
            </span>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">
              {currentVerdict === 'SAFE' && 'SAFE'}
              {currentVerdict === 'WARNING' && 'WARNING'}
              {currentVerdict === 'UNKNOWN' && 'CHECK CAREFULLY'}
              {currentVerdict === 'COMMUNITY_REPORTED' && 'COMMUNITY REPORTED'}
            </h3>
            <p className="text-gray-200">
              {scanResult
                ? `Reports: ${scanResult.reportCount} • URL: ${scanResult.normalizedUrl}`
                : 'Scan a URL to see results from the Zerobait engine.'}
            </p>
            {scanResult && scanResult.reasons.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 text-left text-sm text-gray-200">
                {scanResult.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
          {scanResult && (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                className="text-sm font-medium text-emerald-300 hover:text-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleReport}
                disabled={isReporting}
              >
                {isReporting ? 'Reporting…' : 'Report this URL'}
              </button>
              {reportMessage && <p className="text-xs text-gray-300">{reportMessage}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
