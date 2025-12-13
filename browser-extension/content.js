// Injects a non-intrusive UI overlay and requests a scan of the current page

const OVERLAY_ID = 'zb-overlay-root'

function ensureOverlay() {
  if (document.getElementById(OVERLAY_ID)) return document.getElementById(OVERLAY_ID)
  const root = document.createElement('div')
  root.id = OVERLAY_ID
  root.style.position = 'fixed'
  root.style.inset = 'auto 16px 16px auto'
  root.style.zIndex = '2147483647'
  root.style.fontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu'
  root.style.color = 'white'
  document.documentElement.appendChild(root)
  return root
}

function renderBadge(state) {
  const root = ensureOverlay()
  const { verdict, risk_score } = state
  const color = verdict === 'HIGH' ? '#ef4444' : verdict === 'MEDIUM' ? '#f59e0b' : '#10b981'
  root.innerHTML = `
    <div style="backdrop-filter: blur(6px); background: rgba(17,24,39,0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 12px; display: flex; gap: 10px; align-items: center; box-shadow: 0 4px 24px rgba(0,0,0,0.3);">
      <div style="width:10px;height:10px;border-radius:50%;background:${color}"></div>
      <div style="display:flex;flex-direction:column;gap:2px;">
        <div style="font-weight:800; letter-spacing:0.02em;">${verdict} RISK</div>
        <div style="opacity:0.85; font-size:12px;">Score: ${risk_score}/100</div>
      </div>
      <button id="zb-open" style="margin-left:8px; font-size:12px; padding:6px 8px; border-radius:8px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.06); color:white; cursor:pointer">Details</button>
    </div>
  `
  const btn = root.querySelector('#zb-open')
  btn?.addEventListener('click', () => {
    renderPanel(state)
  })
}

function renderPanel(state) {
  const root = ensureOverlay()
  const { verdict, risk_score, ai_summary, url } = state
  const color = verdict === 'HIGH' ? '#ef4444' : verdict === 'MEDIUM' ? '#f59e0b' : '#10b981'
  root.innerHTML = `
    <div style="backdrop-filter: blur(10px); background: rgba(17,24,39,0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 14px; width: min(360px, 92vw); box-shadow: 0 8px 40px rgba(0,0,0,0.45);">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:10px;height:10px;border-radius:50%;background:${color}"></div>
          <div style="font-weight:900;">${verdict} RISK</div>
        </div>
        <button id="zb-close" style="font-size:12px; padding:4px 6px; border-radius:6px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.06); color:white; cursor:pointer">Close</button>
      </div>
      <div style="margin-top:8px; opacity:0.85; font-size:12px;">URL: ${url}</div>
      <div style="margin-top:10px; font-weight:600;">${ai_summary || 'No summary available.'}</div>
      <div style="margin-top:10px; background:rgba(255,255,255,0.08); border-radius:999px; height:8px; overflow:hidden;">
        <div style="height:100%; width:${Math.min(100, Math.max(0, risk_score))}%; background:${color};"></div>
      </div>
      <div style="display:flex; gap:8px; margin-top:12px;">
        <button id="zb-report" style="font-size:12px; padding:6px 8px; border-radius:8px; border:1px solid rgba(255,255,255,0.12); background:rgba(239,68,68,0.2); color:white; cursor:pointer">Report</button>
      </div>
    </div>
  `
  root.querySelector('#zb-close')?.addEventListener('click', () => renderBadge(state))
  root.querySelector('#zb-report')?.addEventListener('click', async () => {
    try {
      const resp = await chrome.runtime.sendMessage({ type: 'REPORT_URL', url })
      if (resp?.ok) {
        alert('Thanks for your report!')
      } else {
        alert('Report failed: ' + (resp?.error || 'Unknown error'))
      }
    } catch (e) {
      alert('Report failed: ' + e)
    }
  })
}

function verdictOf(score) {
  if (score >= 70) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}

async function run() {
  try {
    const url = location.href
    const existing = document.getElementById(OVERLAY_ID)
    if (existing) existing.remove()
    await chrome.runtime.sendMessage({ type: 'SCAN_URL', url })
  } catch {}
}

run()
