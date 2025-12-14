import exampleData from '../data/reports.example.json'
import { DEFAULT_AUTHOR, MAX_CACHE_ITEMS, RECOMMENDED_LIMIT, REPORTS_API_URL, REPORTS_FALLBACK_URL } from '../constants'
import { validateAndNormalizeReports } from '../utils/validateReport'

const CACHE_KEY = 'reports_cache_v1'

const safeParse = (value) => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const buildUrlWithLimit = (baseUrl, limit) => {
  if (!baseUrl) return null
  try {
    const url = new URL(baseUrl, window.location.origin)
    if (limit) {
      url.searchParams.set('limit', String(limit))
    }
    return url.toString()
  } catch {
    return null
  }
}

const fetchFromSource = async (baseUrl, limit) => {
  const url = buildUrlWithLimit(baseUrl, limit)
  if (!url) return null

  const response = await fetch(url, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)

  const data = await response.json()
  if (Array.isArray(data)) return { reports: data, meta: { total: data.length } }
  return { reports: data.reports || [], meta: data.meta || {} }
}

const persistCache = (reports, meta = {}) => {
  try {
    const limitedReports = reports.slice(0, MAX_CACHE_ITEMS)
    localStorage.setItem(CACHE_KEY, JSON.stringify({ reports: limitedReports, meta, cachedAt: new Date().toISOString() }))
  } catch {
    // ignore cache errors
  }
}

export const readCachedReports = () => {
  try {
    const cached = safeParse(localStorage.getItem(CACHE_KEY))
    if (!cached || !Array.isArray(cached.reports)) return null
    return cached
  } catch {
    return null
  }
}

const normalizePayload = (reports) => {
  const normalized = validateAndNormalizeReports(reports || [])
  return normalized.map((report) => ({ ...report, author: report.author || DEFAULT_AUTHOR }))
}

export const getReportsFromApi = async (limit = RECOMMENDED_LIMIT) => {
  const sources = [REPORTS_API_URL, REPORTS_FALLBACK_URL].filter(Boolean)

  for (const source of sources) {
    try {
      const { reports, meta } = await fetchFromSource(source, limit)
      const normalized = normalizePayload(reports)
      persistCache(normalized, meta)
      return { reports: normalized, meta, source }
    } catch (err) {
      console.warn(`Falha ao buscar relatórios em ${source}:`, err)
    }
  }

  const normalized = normalizePayload(exampleData.reports || [])
  persistCache(normalized, { total: normalized.length })
  return { reports: normalized, meta: { total: normalized.length }, source: 'example' }
}

const buildSlugUrl = (baseUrl, slug) => {
  if (!baseUrl) return null
  try {
    const url = new URL(baseUrl, window.location.origin)
    const cleanPath = url.pathname.replace(/\/$/, '')
    url.pathname = `${cleanPath}/${slug}`
    url.search = ''
    return url.toString()
  } catch {
    return null
  }
}

export const getReportBySlug = async (slug, limit = RECOMMENDED_LIMIT) => {
  if (!slug) return null

  const cached = readCachedReports()
  const cachedMatch = cached?.reports?.find((item) => item.slug === slug)
  if (cachedMatch) return cachedMatch

  const slugUrl = buildSlugUrl(REPORTS_API_URL, slug)
  if (slugUrl) {
    try {
      const response = await fetch(slugUrl, { cache: 'no-cache' })
      if (response.ok) {
        const data = await response.json()
        const normalized = normalizePayload([data])
        if (normalized[0]) return normalized[0]
      }
    } catch (err) {
      console.warn('Falha ao buscar relatório por slug na API', err)
    }
  }

  const { reports } = await getReportsFromApi(limit)
  return reports.find((item) => item.slug === slug) || null
}
