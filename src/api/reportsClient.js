import exampleData from '../data/reports.example.json'
import {
  ACTIVEPIECES_WEBHOOK_BLOG,
  MAX_CACHE_ITEMS,
  RECOMMENDED_LIMIT,
  REPORTS_API_URL,
  REPORTS_FALLBACK_URL,
} from '../constants'
import { normalizeReport, normalizeReportsCollection } from '../utils/reportSchema'
import { getWithTTL, setWithTTL } from '../utils/storage'

const CACHE_KEY = 'reports_cache_v2'
const ENABLE_EXAMPLE_DATA = import.meta.env?.VITE_ENABLE_REPORTS_EXAMPLE === 'true'

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

const fetchReportsPayload = async (url) => {
  const response = await fetch(url, { cache: 'no-cache' })
  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status}`)
    error.status = response.status
    throw error
  }

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

const readCachedReports = () => {
  const cached = getWithTTL(CACHE_KEY)
  if (!cached || !Array.isArray(cached.reports)) return null

  return {
    ...cached,
    reports: cached.reports.map((report) => ({ ...report, dataSource: report.dataSource || 'cache' })),
  }
}

const normalizePayload = (reports, options) => normalizeReportsCollection(reports, options)
  .map((report) => ({ ...report, dataSource: options?.dataSource || (options?.isFallback ? 'fallback' : 'api') }))

const loadFromSources = async ({ limit }) => {
  const sources = [
    { url: buildUrlWithLimit(REPORTS_API_URL, limit), isFallback: false, dataSource: 'api' },
    { url: buildUrlWithLimit(ACTIVEPIECES_WEBHOOK_BLOG, limit), isFallback: false, dataSource: 'webhook' },
    { url: buildUrlWithLimit(REPORTS_FALLBACK_URL, limit), isFallback: true, dataSource: 'fallback' },
  ].filter((entry) => entry.url)

  for (const entry of sources) {
    try {
      const { reports, meta } = await fetchReportsPayload(entry.url)
      const normalized = normalizePayload(reports, { isFallback: entry.isFallback, dataSource: entry.dataSource })
      const payloadMeta = { ...meta, isFallback: entry.isFallback, source: entry.dataSource }
      persistCache(normalized, payloadMeta)
      return { reports: normalized, meta: payloadMeta, source: entry.dataSource }
    } catch (err) {
      console.warn(`Falha ao buscar relatórios em ${entry.url}:`, err)
    }
  }

  return null
}

export const getReports = async ({ limit = RECOMMENDED_LIMIT } = {}) => {
  const cached = readCachedReports()

  const fresh = await loadFromSources({ limit })
  if (fresh?.reports?.length) return fresh

  if (cached?.reports?.length) {
    return { reports: cached.reports, meta: cached.meta || {}, source: 'cache' }
  }

  if (ENABLE_EXAMPLE_DATA) {
    const normalized = normalizePayload(exampleData.reports || [], { isFallback: true })
    persistCache(normalized, { total: normalized.length, isFallback: true })
    return { reports: normalized, meta: { total: normalized.length, isFallback: true }, source: 'example' }
  }

  throw new Error('Não foi possível carregar relatórios no momento.')
}

export const getReportBySlug = async (slug) => {
  if (!slug) return null

  const cached = readCachedReports()
  const cachedMatch = cached?.reports?.find((item) => item.slug === slug)
  if (cachedMatch) return cachedMatch

  const slugUrl = buildSlugUrl(REPORTS_API_URL, slug)
  if (slugUrl) {
    try {
      const response = await fetch(slugUrl, { cache: 'no-cache' })
      if (response.status === 404) return null
      if (!response.ok) throw new Error(`Request failed: ${response.status}`)

      const data = await response.json()
      const normalized = normalizeReport(data, { isFallback: false })
      if (normalized) {
        const cachedCollection = cached?.reports || []
        const merged = [
          { ...normalized, dataSource: 'api' },
          ...cachedCollection.filter((item) => item.slug !== slug),
        ].slice(0, MAX_CACHE_ITEMS)
        persistCache(merged, cached?.meta || {})
        return { ...normalized, dataSource: 'api' }
      }
    } catch (err) {
      console.warn('Falha ao buscar relatório por slug na API', err)
    }
  }

  try {
    const { reports } = await getReports({ limit: RECOMMENDED_LIMIT })
    return reports.find((item) => item.slug === slug) || null
  } catch {
    return null
  }
}
