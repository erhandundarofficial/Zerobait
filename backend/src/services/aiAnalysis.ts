import { URL } from 'url'
import { prisma } from '../prisma'

export type AnalysisResult = {
  ai_summary: string
  risk_score: number
  technical_details: Record<string, unknown>
  from_cache?: boolean
}

function base64Url(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function getHostname(input: string): string | null {
  try {
    return new URL(input).hostname
  } catch {
    return null
  }
}

function normalizeUrl(input: string): string | null {
  try {
    const url = new URL(input.trim())
    url.hostname = url.hostname.toLowerCase()
    if ((url.protocol === 'http:' && url.port === '80') || (url.protocol === 'https:' && url.port === '443')) {
      url.port = ''
    }
    if (url.pathname === '/') url.pathname = ''
    return url.toString()
  } catch {
    return null
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), ms)
  try {
    // @ts-ignore fetch AbortController type
    const res = await p
    return res
  } finally {
    clearTimeout(t)
  }
}

async function safeFetchJson(url: string, init?: any, timeoutMs = 12000): Promise<any> {
  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    try {
      return await res.json()
    } catch {
      return null
    }
  } finally {
    clearTimeout(to)
  }
}

// Small delay helper for polling/retries
async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// If VirusTotal URL lookup returns 404 (not found in cache), submit the URL and poll briefly
async function vtSubmitAndPoll(u: string, apiKey: string): Promise<any> {
  try {
    const submit = await safeFetchJson(
      'https://www.virustotal.com/api/v3/urls',
      {
        method: 'POST',
        headers: { 'x-apikey': apiKey, 'content-type': 'application/x-www-form-urlencoded' },
        body: `url=${encodeURIComponent(u)}`,
      },
      15000,
    )
    const analysisId = submit?.data?.id
    const urlId = base64Url(u)
    // Try a few times to fetch either the analysis or the URL stats
    for (let i = 0; i < 3; i++) {
      await sleep(2500)
      // First try the analyses endpoint
      try {
        const analysis = await safeFetchJson(
          `https://www.virustotal.com/api/v3/analyses/${encodeURIComponent(analysisId || '')}`,
          { headers: { 'x-apikey': apiKey } },
          12000,
        )
        const stats = analysis?.data?.attributes?.stats
        if (stats && typeof stats.malicious === 'number') {
          return { data: { attributes: { last_analysis_stats: stats } } }
        }
      } catch {}
      // Then try the canonical URL stats endpoint
      try {
        const urlData = await safeFetchJson(
          `https://www.virustotal.com/api/v3/urls/${urlId}`,
          { headers: { 'x-apikey': apiKey } },
          12000,
        )
        const vtStats = urlData?.data?.attributes?.last_analysis_stats
        if (vtStats && typeof vtStats.malicious === 'number') return urlData
      } catch {}
    }
    return { pending: true }
  } catch (e: any) {
    return { error: e?.message || 'virustotal_submit_failed' }
  }
}

async function virusTotalLookup(u: string): Promise<any> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY
  if (!apiKey) return { unavailable: true }
  const id = base64Url(u)
  const url = `https://www.virustotal.com/api/v3/urls/${id}`
  try {
    const data = await safeFetchJson(url, { headers: { 'x-apikey': apiKey } })
    return data
  } catch (e: any) {
    const msg = e?.message || ''
    if (msg.includes('HTTP 404')) {
      // Not found in VT cache — submit and briefly poll
      return await vtSubmitAndPoll(u, apiKey)
    }
    return { error: msg || 'virustotal_failed' }
  }
}

async function googleSafeBrowsingCheck(u: string): Promise<any> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY
  if (!apiKey) return { unavailable: true }
  const body = {
    client: { clientId: 'zerobait', clientVersion: '1.0.0' },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url: u }],
    },
  }
  try {
    const data = await safeFetchJson(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    return data
  } catch (e: any) {
    return { error: e?.message || 'gsb_failed' }
  }
}

async function whoisXmlLookup(domain: string): Promise<any> {
  const apiKey = process.env.WHOISXML_API_KEY
  if (!apiKey) return { unavailable: true }
  try {
    let data = await safeFetchJson(
      `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${encodeURIComponent(apiKey)}&domainName=${encodeURIComponent(
        domain,
      )}&outputFormat=JSON`,
      undefined,
      20000,
    )
    const abortedMsg = typeof data?.error === 'string' && /aborted/i.test(data.error)
    const hasDataError = typeof data?.WhoisRecord?.dataError === 'string' && /aborted/i.test(data.WhoisRecord.dataError)
    if (abortedMsg || hasDataError) {
      await sleep(1200)
      data = await safeFetchJson(
        `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${encodeURIComponent(apiKey)}&domainName=${encodeURIComponent(
          domain,
        )}&outputFormat=JSON`,
        undefined,
        22000,
      )
    }
    return data
  } catch (e: any) {
    return { error: e?.message || 'whois_failed' }
  }
}

async function sslLabsAnalyze(domain: string): Promise<any> {
  try {
    const data = await safeFetchJson(
      `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(domain)}&fromCache=on&all=done`,
      undefined,
      15000,
    )
    return data
  } catch (e: any) {
    return { error: e?.message || 'ssllabs_failed' }
  }
}

async function screenshotViaUrlscan(u: string): Promise<{ base64?: string; meta?: any }> {
  const apiKey = process.env.URLSCAN_API_KEY
  if (!apiKey) return {}
  try {
    const submit = await safeFetchJson('https://urlscan.io/api/v1/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'API-Key': apiKey },
      body: JSON.stringify({ url: u, visibility: 'private' }),
    })
    const uuid = submit?.uuid
    if (!uuid) return {}
    let screenshotUrl: string | null = null
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 3000))
      const result = await safeFetchJson(`https://urlscan.io/api/v1/result/${uuid}/`)
      const s = result?.screenshot || result?.task?.screenshotURL || result?.screenshotURL
      if (typeof s === 'string') {
        screenshotUrl = s
        break
      }
    }
    if (!screenshotUrl) return {}
    const controller = new AbortController()
    const to = setTimeout(() => controller.abort(), 12000)
    try {
      const res = await fetch(screenshotUrl, { signal: controller.signal })
      if (!res.ok) return {}
      const buf = Buffer.from(await res.arrayBuffer())
      return { base64: buf.toString('base64'), meta: { source: 'urlscan', url: screenshotUrl } }
    } finally {
      clearTimeout(to)
    }
  } catch {
    return {}
  }
}

function computeRiskScore(details: any): number {
  let score = 0
  const gsbMatches = Array.isArray(details?.googleSafeBrowsing?.matches) && details.googleSafeBrowsing.matches.length > 0
  if (gsbMatches) score += 70
  const vtStats = details?.virusTotal?.data?.attributes?.last_analysis_stats
  if (vtStats && typeof vtStats.malicious === 'number') {
    if (vtStats.malicious > 0) score += 60
    else if (typeof vtStats.suspicious === 'number' && vtStats.suspicious > 0) score += 30
  }
  const createdRaw =
    details?.whois?.WhoisRecord?.createdDate ||
    details?.whois?.WhoisRecord?.registryData?.createdDate ||
    details?.whois?.WhoisRecord?.dataError
  if (createdRaw && typeof createdRaw === 'string') {
    const created = new Date(createdRaw)
    const ageDays = Math.max(0, Math.floor((Date.now() - created.getTime()) / 86400000))
    if (ageDays <= 3) score += 25
    else if (ageDays <= 7) score += 20
    else if (ageDays <= 30) score += 10
  }
  const ssl = details?.sslLabs
  if (ssl && Array.isArray(ssl.endpoints)) {
    const grades = ssl.endpoints.map((e: any) => e.grade).filter((g: any) => typeof g === 'string')
    if (grades.length > 0) {
      const worst = grades.sort()[0]
      if (worst <= 'B') score += 10
      if (worst === 'F' || worst === 'T') score += 20
    }
  }
  if (score > 100) score = 100
  return score
}

// Derive a conservative risk floor from AI wording to avoid contradictions
function riskFloorFromAi(summary: string): number {
  const s = (summary || '').toLowerCase()
  // High severity cues
  const high = [
    'avoid',
    'do not visit',
    'malware',
    'virus',
    'phishing',
    'ransomware',
    'dangerous',
    'harmful',
    'deceptive',
    'unsafe',
    'pirated',
    'cracked',
    'unofficial software',
  ]
  if (high.some((k) => s.includes(k))) return 70

  // Medium severity cues
  const medium = [
    'suspicious',
    'be cautious',
    'use caution',
    'unknown trust',
    'unverified',
    'potentially risky',
    'could be risky',
  ]
  if (medium.some((k) => s.includes(k))) return 40

  return 0
}

function severityFromRisk(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

function enforceSummaryConsistency(summary: string, severity: 'low' | 'medium' | 'high'): string {
  const s = (summary || '').trim()
  if (!s) return s
  if (severity === 'high') {
    // Avoid reassuring phrases when severity is high
    const badPhrases = [/seems safe/i, /safe to use/i, /appears safe/i, /likely safe/i, /not flagged/i]
    if (badPhrases.some((re) => re.test(s))) {
      return 'This site shows high-risk indicators from security checks. Avoid interacting or entering any credentials.'
    }
  }
  if (severity === 'low') {
    // Avoid alarming phrases for low severity
    const overlyHarsh = [/dangerous/i, /high risk/i, /malware/i, /phishing/i]
    if (overlyHarsh.some((re) => re.test(s))) {
      return 'No major issues detected from security checks. It appears safe, but use normal caution online.'
    }
  }
  return s
}

async function callGemini(summaryInput: any, screenshotBase64?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return 'AI analysis unavailable (missing GEMINI_API_KEY).'
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest'
  const systemText =
    "You are a cyber security expert explaining a website's safety to a non-technical friend. Analyze the provided technical JSON data and any screenshot. The JSON includes a severity_hint (low/medium/high) and optionally a risk_score_hint. Your wording MUST align with severity_hint and must not contradict it. Do NOT use markdown, headers, labels, bullet points, or structured prefixes. Do NOT start with 'Risk Level:', 'Why:', or 'Summary:'. Do NOT mention any numerical score. Start directly with the explanation. Keep it concise, direct, and human-readable (max 3 sentences)."
  const jsonText = JSON.stringify(summaryInput)
  const parts: any[] = [{ text: `Technical data:\n${jsonText}` }]
  if (screenshotBase64) {
    parts.push({ inlineData: { mimeType: 'image/png', data: screenshotBase64 } })
  }
  const reqBody: any = {
    contents: [{ role: 'user', parts }],
    systemInstruction: { role: 'system', parts: [{ text: systemText }] },
  }
  try {
    const res = await safeFetchJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(
        apiKey,
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      },
      20000,
    )
    const text = res?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof text === 'string' && text.trim()) return text.trim()
    return 'AI analysis did not return a summary.'
  } catch {
    try {
      const fallbackRes = await safeFetchJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(
          apiKey,
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${systemText}\n\nTechnical data:\n${jsonText}` }] }] }),
        },
        20000,
      )
      const text = fallbackRes?.candidates?.[0]?.content?.parts?.[0]?.text
      if (typeof text === 'string' && text.trim()) return text.trim()
    } catch {}
    return 'AI analysis failed.'
  }
}

export async function analyzeUrlWithAI(u: string): Promise<AnalysisResult> {
  const normalized = normalizeUrl(u) || u
  const domain = getHostname(normalized)

  // Check cache (30-day TTL)
  try {
    const cached = await (prisma as any).scanResult.findUnique({ where: { url: normalized } })
    if (cached) {
      const ageMs = Date.now() - new Date(cached.createdAt).getTime()
      const ttlMs = 30 * 24 * 60 * 60 * 1000
      if (ageMs >= 0 && ageMs < ttlMs) {
        const data = cached.data as any
        const current: AnalysisResult = data as AnalysisResult
        const floor = riskFloorFromAi(current?.ai_summary || '')
        const sevCached = severityFromRisk(typeof current?.risk_score === 'number' ? current.risk_score : 0)
        const adjustedSummary = enforceSummaryConsistency(current?.ai_summary || '', sevCached)
        let updated: AnalysisResult = current
        let needUpdate = false
        if (adjustedSummary !== current?.ai_summary) {
          updated = { ...updated, ai_summary: adjustedSummary }
          needUpdate = true
        }
        if (typeof current?.risk_score === 'number' && floor > current.risk_score) {
          updated = { ...updated, risk_score: floor }
          needUpdate = true
        }
        if (needUpdate) {
          try {
            await (prisma as any).scanResult.update({
              where: { url: normalized },
              data: { riskScore: updated.risk_score, data: updated },
            })
          } catch {}
          return { ...updated, from_cache: true }
        }
        return { ...current, from_cache: true }
      }
    }
  } catch {}
  const tasks: Array<Promise<any>> = []
  const keys: string[] = []

  tasks.push(virusTotalLookup(u))
  keys.push('virusTotal')
  tasks.push(googleSafeBrowsingCheck(u))
  keys.push('googleSafeBrowsing')
  if (domain) {
    tasks.push(whoisXmlLookup(domain))
    keys.push('whois')
    tasks.push(sslLabsAnalyze(domain))
    keys.push('sslLabs')
  }
  tasks.push(screenshotViaUrlscan(u))
  keys.push('screenshot')

  const settled = await Promise.allSettled(tasks)
  const technical: Record<string, unknown> = {}
  let screenshotBase64: string | undefined

  settled.forEach((s, i) => {
    const kMaybe = keys[i]
    const k = typeof kMaybe === 'string' && kMaybe.length > 0 ? kMaybe : `unknown_${i}`
    if (s.status === 'fulfilled') {
      ;(technical as Record<string, unknown>)[k] = s.value
      if (k === 'screenshot' && s.value && typeof s.value.base64 === 'string') {
        screenshotBase64 = s.value.base64
      }
    } else {
      ;(technical as Record<string, unknown>)[k] = { error: s.reason instanceof Error ? s.reason.message : 'failed' }
    }
  })

  const risk = computeRiskScore(technical)
  const severity = severityFromRisk(risk)
  const aiSummaryRaw = await callGemini(
    {
      url: u,
      domain: domain,
      virusTotal: technical.virusTotal,
      googleSafeBrowsing: technical.googleSafeBrowsing,
      whois: technical.whois,
      sslLabs: technical.sslLabs,
      severity_hint: severity,
      risk_score_hint: risk,
    },
    screenshotBase64,
  )
  const aiSummary = enforceSummaryConsistency(aiSummaryRaw, severity)

  // Ensure consistency: raise risk to at least the AI-indicated floor
  const floor = riskFloorFromAi(aiSummary)
  const finalRisk = Math.max(risk, floor)

  const finalSeverity = severityFromRisk(finalRisk)
  const finalSummary = enforceSummaryConsistency(aiSummary, finalSeverity)

  const result: AnalysisResult = {
    ai_summary: finalSummary,
    risk_score: finalRisk,
    technical_details: technical,
  }

  // Save/refresh cache
  try {
    await (prisma as any).scanResult.upsert({
      where: { url: normalized },
      update: { riskScore: result.risk_score, data: result, createdAt: new Date() },
      create: { url: normalized, riskScore: result.risk_score, data: result },
    })
  } catch {}

  return result
}
