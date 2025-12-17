const buildFallbackFromApiUrl = (apiUrl) => {
  if (!apiUrl) return null
  try {
    const url = new URL(apiUrl, window.location.origin)
    url.pathname = '/public/latest.json'
    url.search = ''
    return url.toString()
  } catch (err) {
    console.warn('[reports] Falha ao derivar fallback da API URL', err)
    return null
  }
}

export const REPORTS_API_URL = import.meta.env.VITE_REPORTS_API_URL || '/api/reports'
const FALLBACK_FROM_ENV = import.meta.env.VITE_REPORTS_FALLBACK_URL
const FALLBACK_FROM_API = FALLBACK_FROM_ENV ? null : buildFallbackFromApiUrl(import.meta.env.VITE_REPORTS_API_URL)
export const REPORTS_FALLBACK_URL = FALLBACK_FROM_ENV || FALLBACK_FROM_API || '/reports.json'
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
