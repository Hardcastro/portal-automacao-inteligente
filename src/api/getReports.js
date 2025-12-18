import exampleData from '../data/reports.example.json'
import { DEFAULT_AUTHOR, MAX_CACHE_ITEMS, RECOMMENDED_LIMIT, REPORTS_API_URL, REPORTS_FALLBACK_URL } from '../constants'
import { normalizeReportsCollection, normalizeReport } from '../utils/normalizeReport'
import { validateAndNormalizeReports } from '../utils/validateReport'
import { getWithTTL, setWithTTL } from '../utils/storage'

const CACHE_KEY = 'reports_cache_v1'
let hasWarnedApiUrl = false

const warnIfMissingApiUrl = () => {
  if (hasWarnedApiUrl || REPORTS_API_URL) return
  hasWarnedApiUrl = true
  console.warn('[reports] VITE_REPORTS_API_URL não definido no .env; configure antes de publicar.')
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
  const limitedReports = reports.slice(0, MAX_CACHE_ITEMS)
  setWithTTL(CACHE_KEY, { reports: limitedReports, meta, cachedAt: new Date().toISOString() })
}

export const readCachedReports = () => {
  const cached = getWithTTL(CACHE_KEY)
  if (!cached || !Array.isArray(cached.reports)) return null

  return {
    ...cached,
    reports: cached.reports.map((report) => ({ ...report, dataSource: 'cache' }))
  }
}

const normalizePayload = (reports, isFallback) => {
  const validated = validateAndNormalizeReports(reports || [])
  const normalized = normalizeReportsCollection(validated, { isFallback })
  return normalized.map((report) => ({ ...report, author: report.author || DEFAULT_AUTHOR }))
}

const applySource = (reports, source) => reports.map((report) => ({ ...report, dataSource: source }))

export const getReportsFromApi = async (limit = RECOMMENDED_LIMIT) => {
  warnIfMissingApiUrl()
  const sources = [REPORTS_API_URL, REPORTS_FALLBACK_URL].filter(Boolean)

  for (const source of sources) {
    try {
      const { reports, meta } = await fetchFromSource(source, limit)
      const isFallback = source !== REPORTS_API_URL
      const normalized = normalizePayload(reports, isFallback)
      const withSource = applySource(normalized, isFallback ? 'fallback' : 'api')
      persistCache(withSource, { ...meta, isFallback })
      return { reports: withSource, meta: { ...meta, isFallback }, source }
    } catch (err) {
      console.warn(`Falha ao buscar relatórios em ${source}:`, err)
    }
  }

  const normalized = normalizePayload(exampleData.reports || [], true)
  const withSource = applySource(normalized, 'fallback')
  persistCache(withSource, { total: normalized.length, isFallback: true })
  return { reports: withSource, meta: { total: normalized.length, isFallback: true }, source: 'example' }
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
        if (normalized) {
          const cachedCollection = cached?.reports || []
          const merged = [
            { ...normalized, dataSource: 'api' },
            ...cachedCollection.filter((item) => item.slug !== slug)
          ]
          persistCache(merged, cached?.meta || {})
          return { ...normalized, dataSource: 'api' }
        }
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
  const withSource = applySource(normalized, 'fallback')
  return { reports: withSource, meta: { total: normalized.length, isFallback: true }, source: 'example' }
}
