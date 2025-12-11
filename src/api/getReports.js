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
      return { reports: data.reports, meta: data.meta || {}, source: endpoint }
    } catch (error) {
      console.warn('Falha ao carregar relatórios de', endpoint, error)
    }
  }

  const localData = await import('../data/reports.example.json')
  return { reports: localData.default.reports || [], meta: localData.default.meta || {}, source: 'local' }
}
