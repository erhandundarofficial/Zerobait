import { useEffect, useRef, useState } from 'react'
import { flags } from '../config/featureFlags'

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
  const [showRaw, setShowRaw] = useState<boolean>(flags.showRawTechnicalByDefault)
  const resultRef = useRef<HTMLDivElement | null>(null)
  const [showAnim, setShowAnim] = useState(false)

  useEffect(() => {
    if (aiResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      resultRef.current.focus({ preventScroll: true })
      if (flags.useAnimations) {
        setTimeout(() => setShowAnim(true), 10)
      } else {
        setShowAnim(true)
      }
    }
  }, [aiResult])

  async function handleScan(e: React.FormEvent) {
    e.preventDefault()
    setScanError(null)
    setReportMessage(null)
    if (flags.useAnimations) setShowAnim(false)

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

  const tech: any = aiResult?.technical_details || {}
  const vtStats = tech?.virusTotal?.data?.attributes?.last_analysis_stats ?? tech?.virusTotal ?? null
  const vtMal = Number(vtStats?.malicious ?? 0)
  const vtSusp = Number(vtStats?.suspicious ?? 0)
  const vtUndet = Number(vtStats?.undetected ?? 0)
  const vtHarm = Number(vtStats?.harmless ?? 0)
  const vtTout = Number(vtStats?.timeout ?? 0)
  const vtTotal = vtMal + vtSusp + vtUndet + vtHarm + vtTout
  const vtPct = (n: number) => (vtTotal > 0 ? Math.round((n / vtTotal) * 100) : 0)

  const ssl = tech?.sslLabs
  const sslStatus: string | undefined = ssl?.statusMessage || ssl?.status
  const sslEndpoints: any[] = Array.isArray(ssl?.endpoints) ? ssl.endpoints : []
  const sslUpCount = sslEndpoints.filter((e) => (e.status ?? '').toLowerCase() === 'ready').length

  const whois = tech?.whois?.WhoisRecord || tech?.whois?.WhoisRecord?.registryData || tech?.whois || null
  const createdRaw: string | undefined = whois?.createdDate || whois?.registryData?.createdDate || whois?.domainCreatedDate
  const createdAt = createdRaw ? new Date(createdRaw) : null
  const now = new Date()
  const domainAgeDays = createdAt ? Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))) : null
  const ageLabel = domainAgeDays !== null ? (domainAgeDays < 30 ? 'very new' : domainAgeDays < 180 ? 'new' : 'established') : 'unknown'

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

      <div className="mt-10 sm:mt-16 scroll-mt-24" ref={resultRef} tabIndex={-1} id="scan-result">
        <div
          className={`flex flex-col items-center gap-6 rounded-xl border p-6 text-center sm:p-8 ${verdictColorClasses[currentVerdict]} ${flags.useAnimations ? `transition-all duration-300 ease-out ${showAnim ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}` : ''}`}
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
          <div className={`mt-8 space-y-6 w-full ${flags.useAnimations ? `transition-all duration-300 ease-out ${showAnim ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}` : ''}`}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white/90 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">security</span>
                    VirusTotal
                  </h4>
                  <span className="text-xs text-white/70">
                    {vtTotal > 0 ? `${vtMal + vtSusp} flagged / ${vtTotal} vendors` : 'No vendor data'}
                  </span>
                </div>
                {vtTotal > 0 ? (
                  <>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-white/10 flex">
                      <div className="h-full bg-red-500" style={{ width: `${vtPct(vtMal)}%` }} />
                      <div className="h-full bg-yellow-400" style={{ width: `${vtPct(vtSusp)}%` }} />
                      <div className="h-full bg-emerald-400/80" style={{ width: `${vtPct(vtHarm)}%` }} />
                      <div className="h-full bg-white/20" style={{ width: `${vtPct(vtUndet + vtTout)}%` }} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/80">
                      <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-red-500"></span> Malicious: <span className="font-semibold">{vtMal}</span></div>
                      <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-yellow-400"></span> Suspicious: <span className="font-semibold">{vtSusp}</span></div>
                      <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400/80"></span> Harmless: <span className="font-semibold">{vtHarm}</span></div>
                      <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-white/40"></span> Undetected/Timeout: <span className="font-semibold">{vtUndet + vtTout}</span></div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-white/70">Waiting for vendor analysis…</p>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white/90 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">https</span>
                    SSL Labs
                  </h4>
                  <span className="text-xs text-white/70">{sslStatus ? String(sslStatus) : 'No status'}{sslEndpoints.length ? ` • ${sslUpCount}/${sslEndpoints.length} ready` : ''}</span>
                </div>
                {sslEndpoints.length ? (
                  <div className="flex flex-wrap gap-2">
                    {sslEndpoints.map((e: any, idx: number) => (
                      <span key={idx} className="text-xs px-2 py-1 rounded-md border border-white/10 bg-white/5 text-white/80">
                        {e.ipAddress || e.serverName || 'endpoint'} • {e.status || 'unknown'} {e.grade ? `• ${e.grade}` : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/70">No endpoints yet.</p>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white/90 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">schedule</span>
                    WHOIS (Domain Age)
                  </h4>
                  <span className="text-xs text-white/70">{domainAgeDays !== null ? `${domainAgeDays} days` : 'unknown'}</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full ${domainAgeDays !== null && domainAgeDays < 30 ? 'bg-red-500' : domainAgeDays !== null && domainAgeDays < 180 ? 'bg-yellow-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.max(8, Math.min(100, (domainAgeDays ?? 0) / 365 * 100))}%` }}
                    />
                  </div>
                  <div className="text-xs text-white/80">This domain appears <span className="font-semibold">{ageLabel}</span>. Newer domains are often riskier.</div>
                </div>
              </div>
            </div>

            {aiResult.technical_details?.screenshot?.base64 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col items-center">
                <h4 className="mb-2 text-sm font-bold text-white/90">Screenshot</h4>
                <img
                  src={`data:image/png;base64,${aiResult.technical_details.screenshot.base64}`}
                  alt="Website screenshot"
                  className="max-h-80 w-auto rounded-lg border border-white/10"
                />
              </div>
            )}

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white/90">Raw technical details</h4>
                <button
                  type="button"
                  onClick={() => setShowRaw((v) => !v)}
                  className="text-xs font-semibold text-secondary hover:text-white"
                >
                  {showRaw ? 'Hide' : 'Show'}
                </button>
              </div>
              {showRaw && (
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs text-white/80 border border-white/10 rounded-lg p-3 bg-black/20">
{JSON.stringify(aiResult.technical_details?.virusTotal, null, 2)}
                  </pre>
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs text-white/80 border border-white/10 rounded-lg p-3 bg-black/20">
{JSON.stringify(aiResult.technical_details?.sslLabs, null, 2)}
                  </pre>
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs text-white/80 border border-white/10 rounded-lg p-3 bg-black/20 sm:col-span-2">
{JSON.stringify(aiResult.technical_details?.whois, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
