export const REPORTS_API_URL = import.meta.env.VITE_REPORTS_API_URL || '/api/reports'
export const REPORTS_FALLBACK_URL = import.meta.env.VITE_REPORTS_FALLBACK_URL || '/reports.json'
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
