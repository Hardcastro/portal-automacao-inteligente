import exampleData from '../data/reports.example.json'
import { DEFAULT_AUTHOR, MAX_CACHE_ITEMS, RECOMMENDED_LIMIT, REPORTS_API_URL, REPORTS_FALLBACK_URL } from '../constants'
import { normalizeReportsCollection, normalizeReport } from '../utils/normalizeReport'
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
  if (data && typeof data === 'object' && 'latest' in data) {
    const reports = data.latest ? [data.latest] : []
    return { reports, meta: { ...(data.meta || {}), total: reports.length } }
  }
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

const normalizePayload = (reports, isFallback) => {
  const validated = validateAndNormalizeReports(reports || [])
  const normalized = normalizeReportsCollection(validated, { isFallback })
  return normalized.map((report) => ({ ...report, author: report.author || DEFAULT_AUTHOR }))
}

export const getReportsFromApi = async (limit = RECOMMENDED_LIMIT) => {
  const sources = [REPORTS_API_URL, REPORTS_FALLBACK_URL].filter(Boolean)

  for (const source of sources) {
    try {
      const { reports, meta } = await fetchFromSource(source, limit)
      const isFallback = source !== REPORTS_API_URL
      const normalized = normalizePayload(reports, isFallback)
      persistCache(normalized, { ...meta, isFallback })
      return { reports: normalized, meta: { ...meta, isFallback }, source }
    } catch (err) {
      console.warn(`Falha ao buscar relatórios em ${source}:`, err)
    }
  }

  const normalized = normalizePayload(exampleData.reports || [], true)
  persistCache(normalized, { total: normalized.length, isFallback: true })
  return { reports: normalized, meta: { total: normalized.length, isFallback: true }, source: 'example' }
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
        const normalized = normalizeReport(data)
        if (normalized) return normalized
      }
    } catch (err) {
      console.warn('Falha ao buscar relatório por slug na API', err)
    }
  }

  const { reports } = await getReportsFromApi(limit)
  return reports.find((item) => item.slug === slug) || null
}

export const getReports = async (limit = RECOMMENDED_LIMIT) => {
  const cached = readCachedReports()
  if (cached?.reports) {
    console.info('[analytics] usando cache de relatórios', { total: cached.reports.length })
  }

  const fresh = await getReportsFromApi(limit)
  if (fresh?.reports?.length) {
    return fresh
  }

  if (cached?.reports?.length) {
    return { reports: cached.reports, meta: cached.meta || {}, source: 'cache' }
  }

  const normalized = normalizePayload(exampleData.reports || [], true)
  return { reports: normalized, meta: { total: normalized.length, isFallback: true }, source: 'example' }
}
