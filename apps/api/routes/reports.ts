import crypto from 'node:crypto'
import { z } from 'zod'
import express from '../../shared/miniExpress.js'
import { enforceTenantScope, requireScope } from '../middlewares/auth.js'
import { idempotencyMiddleware } from '../middlewares/idempotency.js'
import { createRateLimitMiddleware } from '../middlewares/rateLimit.js'
import { HttpError } from '../../shared/httpError.js'
import { config } from '../../shared/env.js'
import type { NextFunction, RequestWithContext, ResponseLike } from '../../shared/types.js'
import { getOutboxQueue } from '../../shared/queues.js'

const router = express.Router({ mergeParams: true })

export const ReportInputSchema = z.object({
  slug: z.string().min(3).optional(),
  title: z.string().min(1),
  summary: z.string().min(1).optional(),
  publishedAt: z.string().datetime().optional(),
  body: z.any(),
})

export type ReportInput = z.infer<typeof ReportInputSchema>

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const ensureSlug = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return slugify(trimmed)
}

const normalizePayload = (payload: ReportInput) => {
  const title = payload.title.trim()
  const summary = payload.summary ? payload.summary.trim() : null
  const publishedAtRaw = payload.publishedAt
  const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : null
  const slug = payload.slug ? ensureSlug(payload.slug) : ''

  if (!title) throw new HttpError(400, 'Payload invalido', 'title e obrigatorio')
  if (publishedAt && Number.isNaN(publishedAt.getTime())) throw new HttpError(400, 'Payload invalido', 'publishedAt invalido')

  const deterministicHash = crypto
    .createHash('sha256')
    .update(`${title}:${publishedAt?.toISOString() || ''}`)
    .digest('hex')
  const baseSlug = slug || `${slugify(title)}-${deterministicHash.slice(0, 8)}`

  return {
    slug: ensureSlug(baseSlug),
    title,
    summary,
    content: payload.body,
    publishedAt,
  }
}

router.post(
  '/',
  requireScope('reports:write'),
  enforceTenantScope(),
  createRateLimitMiddleware({ prefix: 'reports:write', limit: config.RATE_LIMIT_REPORTS_WRITE }),
  idempotencyMiddleware(),
  async (req: RequestWithContext, res: ResponseLike, next: NextFunction) => {
    try {
      const tenantId = req.params?.tenantId
      if (!tenantId) throw new HttpError(400, 'Tenant nao informado')
      if (!req.prisma) throw new HttpError(500, 'Prisma nao configurado')

      const parsed = ReportInputSchema.array().or(ReportInputSchema).parse(req.body)
      const input = Array.isArray(parsed) ? parsed : [parsed]
      const normalized = input.map(normalizePayload)

      type TransactionResult = {
        created: number
        updated: number
        items: Array<{ id: string; slug: string; action: 'created' | 'updated'; eventId: string }>
      }

      const result: TransactionResult = await (req.prisma as any).$transaction(async (tx: any) => {
        let created = 0
        let updated = 0
        const items: Array<{ id: string; slug: string; action: 'created' | 'updated'; eventId: string }> = []

        for (const payload of normalized) {
          const existing = await tx.report.findFirst({
            where: { tenantId, slug: payload.slug },
          })
          const saved = await tx.report.upsert({
            where: { tenantId_slug: { tenantId, slug: payload.slug } },
            update: {
              title: payload.title,
              summary: payload.summary,
              content: payload.content,
              publishedAt: payload.publishedAt,
            },
            create: {
              tenantId,
              ...payload,
            },
          })

          const action = existing ? 'updated' : 'created'
          if (action === 'created') created += 1
          else updated += 1

          const event = await tx.outboxEvent.create({
            data: {
              tenantId,
              type: 'REPORT_PUBLISHED',
              payload: { reportId: saved.id, slug: saved.slug, title: saved.title },
              status: 'PENDING',
            },
          })

          items.push({ id: saved.id, slug: saved.slug, action, eventId: event.id })
        }

        return { created, updated, items }
      })

      const outboxQueue = getOutboxQueue()
      await Promise.all(
        result.items.map((item) =>
          outboxQueue.add(
            'outbox',
            { eventId: item.eventId },
            { attempts: 8, backoff: { type: 'exponential', delay: 2000 } },
          ),
        ),
      )

      res.status(201).json({ total: normalized.length, created: result.created, updated: result.updated, items: result.items })
    } catch (err) {
      next(err)
    }
  },
)

router.get(
  '/',
  requireScope('reports:read'),
  enforceTenantScope(),
  createRateLimitMiddleware({ prefix: 'reports:read', limit: config.RATE_LIMIT_REPORTS_READ }),
  async (req: RequestWithContext, res: ResponseLike, next: NextFunction) => {
    try {
      const tenantId = req.params?.tenantId
      if (!tenantId) throw new HttpError(400, 'Tenant nao informado')
      if (!req.prisma) throw new HttpError(500, 'Prisma nao configurado')

      const limit = Math.min(Number(req.query?.limit) || 50, 200)
      const cursor = req.query?.cursor

      const query = await req.prisma.report.findMany({
        where: { tenantId },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: String(cursor) }, skip: 1 } : {}),
      })

      const hasNext = query.length > limit
      const items = hasNext ? query.slice(0, limit) : query
      const nextCursor = hasNext ? query[limit].id : null

      res.json({ reports: items, meta: { total: items.length, nextCursor } })
    } catch (err) {
      next(err)
    }
  },
)

router.get(
  '/latest',
  requireScope('reports:read'),
  enforceTenantScope(),
  createRateLimitMiddleware({ prefix: 'reports:read', limit: config.RATE_LIMIT_REPORTS_READ }),
  async (req: RequestWithContext, res: ResponseLike, next: NextFunction) => {
    try {
      const tenantId = req.params?.tenantId
      if (!tenantId) throw new HttpError(400, 'Tenant nao informado')
      if (!req.prisma) throw new HttpError(500, 'Prisma nao configurado')

      const latest = await req.prisma.report.findFirst({
        where: { tenantId },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      })

      if (!latest) return res.status(404).json({ message: 'Nenhum relatorio encontrado' })
      res.json({ latest })
    } catch (err) {
      next(err)
    }
  },
)

export default router
