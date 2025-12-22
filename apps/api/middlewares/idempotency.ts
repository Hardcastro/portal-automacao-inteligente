import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'
import { config } from '../../shared/env.js'
import { HttpError } from '../../shared/httpError.js'
import type { NextFunction, RequestWithContext, ResponseLike } from '../../shared/types.js'
import type { PrismaClientLike } from '../../shared/prismaClient.js'

const ttlMs = config.IDP_TTL_HOURS * 60 * 60 * 1000

const stableStringify = (value: unknown) => {
  if (value === undefined) return ''
  return JSON.stringify(value, (_key: string, val: unknown) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.keys(val as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = (val as Record<string, unknown>)[key]
          return acc
        }, {})
    }
    return val
  })
}

const computeRequestHash = (req: RequestWithContext) => {
  const body = stableStringify(req.body ?? {})
  const contentType = req.get?.('content-type') || 'application/json'
  return crypto.createHash('sha256').update(`${contentType}:${body}`).digest('hex')
}

const persistResponse = async (
  prisma: PrismaClientLike,
  ctx: { recordId: string } | undefined,
  statusCode: number,
  body: unknown,
) => {
  if (!ctx?.recordId) return
  await prisma.idempotencyKey.update({
    where: { id: ctx.recordId },
    data: {
      status: 'COMPLETED',
      statusCode,
      responseBody: body as Prisma.InputJsonValue,
      responseHeaders: { 'content-type': 'application/json' } as Prisma.InputJsonValue,
    },
  })
}

export const idempotencyMiddleware =
  (prismaInstance?: PrismaClientLike) => async (req: RequestWithContext, res: ResponseLike, next: NextFunction) => {
    const prisma = prismaInstance || req.prisma
    if (!prisma) return next(new HttpError(500, 'Prisma nao configurado'))
    const headerKey = req.get?.('idempotency-key')
    if (!headerKey) return next(new HttpError(400, 'Idempotency-Key e obrigatorio'))

    const tenantId = req.auth?.tenantId
    if (!tenantId) return next(new HttpError(400, 'Tenant nao resolvido para idempotencia'))

    const requestHash = computeRequestHash(req)
    const path = (req.baseUrl || '') + (req.path || '')
    const method = req.method || 'POST'

    let record: any | null
    let createdNow = false
    try {
      record = await prisma.idempotencyKey.create({
        data: {
          tenantId,
          key: headerKey,
          method,
          path,
          requestHash,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + ttlMs),
        },
      })
      createdNow = true
    } catch (_err) {
      record = await prisma.idempotencyKey.findFirst({
        where: { tenantId, key: headerKey, method, path },
      })
    }

    if (!record) return next(new HttpError(500, 'Falha ao registrar idempotencia'))

    const expiresAt = record.expiresAt ? new Date(record.expiresAt) : null
    const expired = expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()
    if (expired) {
      record = await prisma.idempotencyKey.update({
        where: { id: record.id },
        data: {
          requestHash,
          status: 'PENDING',
          responseBody: Prisma.DbNull,
          responseHeaders: Prisma.DbNull,
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
        Object.entries(record.responseHeaders).forEach(([k, v]) => res.setHeader(k, String(v)))
      }
      return res.status(record.statusCode || 200).json(record.responseBody)
    } else if (!createdNow && record.status === 'PENDING') {
      return next(new HttpError(409, 'Requisicao em processamento', 'Tente novamente em instantes', 'idempotency_in_progress'))
    }

    const ctx = { recordId: record.id }
    res.locals = res.locals || {}
    res.locals.idempotency = ctx

    const originalJson = res.json.bind(res)
    res.json = async (payload: unknown) => {
      await persistResponse(prisma, ctx, res.statusCode || 200, payload)
      return originalJson(payload)
    }

    const originalSend = res.send.bind(res)
    res.send = async (payload: unknown) => {
      await persistResponse(prisma, ctx, res.statusCode || 200, payload)
      return originalSend(payload)
    }

    return next()
  }
