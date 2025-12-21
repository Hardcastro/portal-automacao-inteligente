import crypto from 'node:crypto'
import { config } from '../../shared/env.js'
import { HttpError } from '../../shared/errors.js'

const ttlMs = config.IDP_TTL_HOURS * 60 * 60 * 1000

const stableStringify = (value) => {
  if (value === undefined) return ''
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.keys(val)
        .sort()
        .reduce((acc, key) => {
          acc[key] = val[key]
          return acc
        }, {})
    }
    return val
  })
}

const computeRequestHash = (req) => {
  const body = stableStringify(req.body ?? {})
  const contentType = req.get('content-type') || 'application/json'
  return crypto.createHash('sha256').update(`${contentType}:${body}`).digest('hex')
}

const persistResponse = async (prisma, ctx, statusCode, body) => {
  if (!ctx?.recordId) return
  await prisma.idempotencyKey.update({
    where: { id: ctx.recordId },
    data: {
      status: 'COMPLETED',
      statusCode,
      responseBody: body,
      responseHeaders: { 'content-type': 'application/json' },
    },
  })
}

export const idempotencyMiddleware = (prismaInstance) => async (req, res, next) => {
  const prisma = prismaInstance || req.prisma
  if (!prisma) return next(new HttpError(500, 'Prisma não configurado'))
  const headerKey = req.get('idempotency-key')
  if (!headerKey) return next(new HttpError(400, 'Idempotency-Key é obrigatório'))

  const tenantId = req.auth?.tenantId
  if (!tenantId) return next(new HttpError(400, 'Tenant não resolvido para idempotência'))

  const requestHash = computeRequestHash(req)
  const path = req.baseUrl + req.path

  let record
  let createdNow = false
  try {
    record = await prisma.idempotencyKey.create({
      data: {
        tenantId,
        key: headerKey,
        method: req.method,
        path,
        requestHash,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + ttlMs),
      },
    })
    createdNow = true
  } catch (err) {
    // possível duplicidade
    record = await prisma.idempotencyKey.findFirst({
      where: { tenantId, key: headerKey, method: req.method, path },
    })
  }

  if (!record) return next(new HttpError(500, 'Falha ao registrar idempotência'))

  const expiresAt = record.expiresAt ? new Date(record.expiresAt) : null
  const expired = expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()
  if (expired) {
    record = await prisma.idempotencyKey.update({
      where: { id: record.id },
      data: {
        requestHash,
        status: 'PENDING',
        responseBody: null,
        responseHeaders: null,
        statusCode: null,
        expiresAt: new Date(Date.now() + ttlMs),
      },
    })
    createdNow = true
  } else if (record.requestHash !== requestHash) {
    return next(
      new HttpError(
        409,
        'Idempotency-Key reutilizada com payload diferente',
        'Use uma nova chave para payloads diferentes',
        'idempotency_conflict',
      ),
    )
  } else if (record.status === 'COMPLETED' && record.responseBody) {
    if (record.responseHeaders) {
      Object.entries(record.responseHeaders).forEach(([k, v]) => res.setHeader(k, v))
    }
    return res.status(record.statusCode || 200).json(record.responseBody)
  } else if (!createdNow && record.status === 'PENDING') {
    return next(new HttpError(409, 'Requisição em processamento', 'Tente novamente em instantes', 'idempotency_in_progress'))
  }

  const ctx = { recordId: record.id }
  res.locals.idempotency = ctx

  const originalJson = res.json.bind(res)
  res.json = async (payload) => {
    await persistResponse(prisma, ctx, res.statusCode || 200, payload)
    return originalJson(payload)
  }

  const originalSend = res.send.bind(res)
  res.send = async (payload) => {
    await persistResponse(prisma, ctx, res.statusCode || 200, payload)
    return originalSend(payload)
  }

  return next()
}
