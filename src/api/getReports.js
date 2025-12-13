import { REPORTS_API_URL, REPORTS_FALLBACK_URL, RECOMMENDED_LIMIT } from '../constants'

const STORAGE_KEY = 'reports_cache'
import { REPORTS_API_URL, REPORTS_FALLBACK_URL } from '../constants'

const appendLimitParam = (url, limit) => {
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const parsed = new URL(url, base)
    if (!parsed.searchParams.has('limit')) {
      parsed.searchParams.set('limit', limit)
    }
    const fullUrl = parsed.toString()
    const isAbsolute = /^https?:\/\//i.test(url)
    return isAbsolute ? fullUrl : parsed.pathname + parsed.search + parsed.hash
  } catch (error) {
    console.warn('Não foi possível aplicar limit ao endpoint', url, error)
    return url
  }
}

const fetchFromUrl = async (url) => {
  const response = await fetch(url, { cache: 'no-cache' })
  if (!response.ok) {
    throw new Error(`Falha ao buscar ${url}: ${response.status}`)
  }
  const data = await response.json()
  if (data?.latest) {
    return { reports: data.latest ? [data.latest] : [], meta: { lastUpdated: data.generatedAt || null } }
  }
  if (!data?.reports && !Array.isArray(data)) {
    throw new Error(`Resposta inválida de ${url}`)
  }
  return data.reports ? data : { reports: data }
}

const saveCache = (payload) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, cachedAt: Date.now() }))
  } catch (error) {
    console.warn('Não foi possível salvar cache local', error)
  }
}

const loadCache = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed
  } catch (error) {
    console.warn('Não foi possível ler cache local', error)
    return null
  }
}

export const getReportsFromApi = async (limit = RECOMMENDED_LIMIT) => {
  if (!data?.reports) {
    throw new Error(`Resposta inválida de ${url}`)
  }
  return data
}

export const getReportsFromApi = async (limit = 60) => {
  const sources = [REPORTS_API_URL, REPORTS_FALLBACK_URL].filter(Boolean)

  for (const source of sources) {
    const endpoint = appendLimitParam(source, limit)
    try {
      const data = await fetchFromUrl(endpoint)
      saveCache({ reports: data.reports, meta: data.meta || {}, source: endpoint })
      return { reports: data.reports, meta: data.meta || {}, source: endpoint }
    } catch (error) {
      console.warn('Falha ao carregar relatórios de', endpoint, error)
    }
  }

  const cached = loadCache()
  if (cached?.reports) {
    return { reports: cached.reports, meta: cached.meta || {}, source: 'cache' }
  }

  const localData = await import('../data/reports.example.json')
  return { reports: localData.default.reports || [], meta: localData.default.meta || {}, source: 'local' }
}

export const getReportBySlug = async (slug) => {
  if (!slug) return null

  const cache = loadCache()
  const cachedReport = cache?.reports?.find((item) => item.slug === slug)
  if (cachedReport) return cachedReport

  if (REPORTS_API_URL) {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
      const url = new URL(`${REPORTS_API_URL.replace(/\/$/, '')}/${slug}`, base)
      const response = await fetch(url.toString(), { cache: 'no-cache' })
      if (response.ok) {
        const report = await response.json()
        return report
      }
    } catch (error) {
      console.warn('Não foi possível carregar relatório individual', error)
    }
  }

  return cachedReport || null
}
  const localData = await import('../data/reports.example.json')
  return { reports: localData.default.reports || [], meta: localData.default.meta || {}, source: 'local' }
}
