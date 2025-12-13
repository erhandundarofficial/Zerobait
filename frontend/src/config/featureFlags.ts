// Centralized feature flags for frontend
// Values can be overridden via Vite env variables (VITE_*), or localStorage in dev.
// This provides foundations for future surfaces like browser extension, email integration, mobile, org dashboards.

function boolFromEnv(name: string, fallback: boolean): boolean {
  const raw = (import.meta as any).env?.[name]
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(s)) return true
    if (['0', 'false', 'no', 'off'].includes(s)) return false
  }
  return fallback
}

function boolFromLocalStorage(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const s = raw.trim().toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(s)) return true
    if (['0', 'false', 'no', 'off'].includes(s)) return false
    return fallback
  } catch {
    return fallback
  }
}

export const featureFlags = {
  // Visual behavior
  useAnimations: boolFromEnv('VITE_USE_ANIMATIONS', true),
  showRawTechnicalByDefault: boolFromEnv('VITE_SHOW_RAW_TECHNICAL', false),

  // Future surfaces (disabled by default)
  enableBrowserExtension: boolFromEnv('VITE_ENABLE_BROWSER_EXTENSION', false),
  enableEmailIntegration: boolFromEnv('VITE_ENABLE_EMAIL_INTEGRATION', false),
  enableMobilePWA: boolFromEnv('VITE_ENABLE_MOBILE_PWA', false),
  enableOrgDashboards: boolFromEnv('VITE_ENABLE_ORG_DASHBOARDS', false),
}

// Allow dev-time overrides via localStorage (optional)
export const devOverrides = {
  useAnimations: boolFromLocalStorage('flags_useAnimations', featureFlags.useAnimations),
  showRawTechnicalByDefault: boolFromLocalStorage('flags_showRawTechnical', featureFlags.showRawTechnicalByDefault),
}

export const flags = {
  ...featureFlags,
  ...devOverrides,
}

export type FeatureFlags = typeof flags;
