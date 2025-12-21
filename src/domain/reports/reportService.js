import { normalizeIncomingReports } from '../../utils/serverReportUtils.js'
import { findReportBySlug, getReports, upsertReports } from '../../../data/reportsData.js'

const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000
const idempotencyCache = new Map()

const now = () => Date.now()

const getCachedResult = (key) => {
  if (!key) return null
  const entry = idempotencyCache.get(key)
  if (!entry) return null
  if (now() - entry.storedAt > IDEMPOTENCY_TTL_MS) {
    idempotencyCache.delete(key)
    return null
  }
  return entry.result
}

const setCachedResult = (key, result) => {
  if (!key) return
  idempotencyCache.set(key, { result, storedAt: now() })
}

export const buildIncomingCollection = (body) => {
  const incoming = normalizeIncomingReports(body)
  if (incoming.length === 0) {
    const error = new Error('Payload deve ser um objeto ou array de relatórios')
    error.status = 400
    throw error
  }
  return incoming
}

export const publishReports = async ({ body, idempotencyKey }) => {
  const cached = getCachedResult(idempotencyKey)
  if (cached) {
    return { ...cached, idempotent: true }
  }

  const incoming = buildIncomingCollection(body)
  let payload
  try {
    payload = await upsertReports(incoming)
  } catch (error) {
    const enriched = error
    enriched.status = enriched.status || 400
    throw enriched
  }
  const response = {
    message: 'Relatórios armazenados com sucesso',
    total: payload.meta.total,
    lastUpdated: payload.meta.lastUpdated,
  }

  setCachedResult(idempotencyKey, response)
  return response
}

export const listReports = (limit) => {
  const clamped = Math.max(1, Math.min(Number.parseInt(limit, 10) || 60, 200))
  const data = getReports(clamped)
  return {
    reports: data.reports,
    meta: { total: data.meta.total, lastUpdated: data.meta.lastUpdated },
  }
}

export const findReport = (slug) => findReportBySlug(slug)
