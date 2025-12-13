// Zerobait MV3 service worker
// Scans URLs via backend and caches results per URL for a short time

const API_BASE = 'http://localhost:4000/api'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/** @type {Map<string, { result: any; ts: number }>} */
const memoryCache = new Map()

chrome.runtime.onInstalled.addListener(() => {
  // no-op
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'SCAN_URL') {
    const rawUrl = String(message.url || '').trim()
    tryOpenPopup()
    scanUrl(rawUrl)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((err) => sendResponse({ ok: false, error: String(err?.message || err) }))
    return true // keep channel open
  }
  if (message?.type === 'REPORT_URL') {
    const rawUrl = String(message.url || '').trim()
    reportUrl(rawUrl)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((err) => sendResponse({ ok: false, error: String(err?.message || err) }))
    return true
  }
})

function normalizeUrl(url) {
  try {
    let s = url.trim()
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s
    const u = new URL(s)
    u.protocol = 'https:'
    return u.toString()
  } catch {
    return url
  }
}

async function scanUrl(url) {
  const u = normalizeUrl(url)
  const now = Date.now()
  const hit = memoryCache.get(u)
  if (hit && now - hit.ts < CACHE_TTL_MS) return hit.result

  const res = await fetch(`${API_BASE}/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: u }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Scan failed')
  memoryCache.set(u, { result: data, ts: now })
  try {
    await chrome.storage.session.set({ ['scan:' + u]: { data, ts: now } })
  } catch {}
  return data
}

async function reportUrl(url) {
  const u = normalizeUrl(url)
  const res = await fetch(`${API_BASE}/report-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: u }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) throw new Error(data.error || 'Report failed')
  return data
}

async function tryOpenPopup() {
  try {
    if (chrome.action && chrome.action.openPopup) {
      await chrome.action.openPopup()
      return
    }
    throw new Error('openPopup not available')
  } catch (e) {
    try {
      const url = chrome.runtime.getURL('popup.html')
      await chrome.windows.create({ url, type: 'popup', width: 380, height: 520, focused: true })
    } catch {}
  }
}
