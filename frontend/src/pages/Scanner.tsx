import { useState } from 'react'

type AiScanResponse = {
  ai_summary: string
  risk_score: number
  technical_details: any
}

export default function ScannerPage() {
  const [url, setUrl] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<AiScanResponse | null>(null)
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
      const response = await fetch('http://localhost:4000/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setScanError((data as any).error || 'Failed to analyze URL.')
        setAiResult(null)
        return
      }

      const data = (await response.json()) as AiScanResponse
      setAiResult(data)
    } catch (error) {
      setScanError('Network error while analyzing URL.')
      setAiResult(null)
    } finally {
      setIsScanning(false)
    }
  }

  async function handleReport() {
    if (!url.trim()) return

    setIsReporting(true)
    setReportMessage(null)
    try {
      const response = await fetch('http://localhost:4000/api/report-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) {
        setReportMessage(data.error || 'Failed to report URL.')
        return
      }

      setReportMessage('Thanks for your report!')
    } catch (error) {
      setReportMessage('Network error while reporting URL.')
    } finally {
      setIsReporting(false)
    }
  }
  const isIdle = !aiResult
  const risk = aiResult?.risk_score ?? 0
  const riskLevel = isIdle ? 'IDLE' : risk >= 70 ? 'HIGH' : risk >= 40 ? 'MEDIUM' : 'LOW'
  const verdictColorClasses: Record<string, string> = {
    IDLE: 'border-white/20 bg-white/5 text-gray-200',
    HIGH: 'border-red-500/30 bg-red-500/10 text-red-300',
    MEDIUM: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    LOW: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  }

  const currentVerdict = isIdle ? 'IDLE' : riskLevel

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
              {isIdle ? 'help' : riskLevel === 'HIGH' ? 'gpp_bad' : riskLevel === 'MEDIUM' ? 'warning' : 'verified_user'}
            </span>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">
              {isIdle ? 'READY TO SCAN' : riskLevel === 'HIGH' ? 'HIGH RISK' : riskLevel === 'MEDIUM' ? 'MODERATE RISK' : 'LOW RISK'}
            </h3>
            <p className="text-gray-200">
              {aiResult ? `URL: ${url.trim()}` : 'Scan a URL to see results from the Zerobait engine.'}
            </p>
            {aiResult && (
              <p className="text-gray-100 text-lg font-semibold max-w-3xl mx-auto">{aiResult.ai_summary}</p>
            )}
            {aiResult && (
              <div className="mt-4 w-full max-w-[560px] mx-auto text-left">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold">Risk Score</span>
                  <span>{risk}/100</span>
                </div>
                <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full ${riskLevel === 'HIGH' ? 'bg-red-500' : riskLevel === 'MEDIUM' ? 'bg-yellow-400' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(100, Math.max(0, risk))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          {aiResult && (
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

        {aiResult && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 w-full">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="mb-2 text-sm font-bold text-white/90">VirusTotal</h4>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-white/80">
{JSON.stringify(aiResult.technical_details?.virusTotal?.data?.attributes?.last_analysis_stats ?? aiResult.technical_details?.virusTotal, null, 2)}
              </pre>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="mb-2 text-sm font-bold text-white/90">SSL Labs</h4>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-white/80">
{JSON.stringify(aiResult.technical_details?.sslLabs?.endpoints ?? aiResult.technical_details?.sslLabs, null, 2)}
              </pre>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="mb-2 text-sm font-bold text-white/90">WHOIS (Domain)</h4>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-white/80">
{JSON.stringify(
  aiResult.technical_details?.whois?.WhoisRecord?.createdDate ??
    aiResult.technical_details?.whois?.WhoisRecord?.registryData?.createdDate ??
    aiResult.technical_details?.whois,
  null,
  2,
)}
              </pre>
            </div>
            {aiResult.technical_details?.screenshot?.base64 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col items-center">
                <h4 className="mb-2 text-sm font-bold text-white/90">Screenshot</h4>
                <img
                  src={`data:image/png;base64,${aiResult.technical_details.screenshot.base64}`}
                  alt="Website screenshot"
                  className="max-h-64 w-auto rounded-lg border border-white/10"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
