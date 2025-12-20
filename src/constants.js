const buildDefaultApiUrl = () => {
  if (typeof window !== 'undefined' && window?.location?.origin) {
    return `${window.location.origin.replace(/\/$/, '')}/api/reports`
  }
  return '/api/reports'
}

const buildDefaultFallbackUrl = () => {
  if (typeof window !== 'undefined' && window?.location?.origin) {
    return `${window.location.origin.replace(/\/$/, '')}/public/latest.json`
  }
  return '/public/latest.json'
}

export const REPORTS_API_URL = import.meta.env?.VITE_REPORTS_API_URL || buildDefaultApiUrl()
export const ACTIVEPIECES_WEBHOOK_BLOG = import.meta.env?.VITE_ACTIVEPIECES_WEBHOOK_BLOG || null
export const REPORTS_FALLBACK_URL = import.meta.env?.VITE_REPORTS_FALLBACK_URL || buildDefaultFallbackUrl()
export const RECOMMENDED_LIMIT = 60
export const DEFAULT_AUTHOR = 'Motor Inteligente'
export const MAX_CACHE_ITEMS = 200
export const EXCERPT_LIMIT = 240

export const CATEGORY_COLORS = {
  geopolitica: 'from-emerald-400/20 to-cyan-luminous/20',
  macroeconomia: 'from-amber-300/20 to-orange-500/20',
  tendencias: 'from-purple-400/20 to-pink-500/20',
  mercados: 'from-blue-400/20 to-indigo-500/20',
}
