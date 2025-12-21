import crypto from 'node:crypto'
import express from '../../shared/miniExpress.js'
import { enforceTenantScope, requireScope } from '../middlewares/auth.js'
import { idempotencyMiddleware } from '../middlewares/idempotency.js'
import { createRateLimitMiddleware } from '../middlewares/rateLimit.js'
import { HttpError } from '../../shared/errors.js'
import { config } from '../../shared/env.js'

const router = express.Router({ mergeParams: true })

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const normalizePayload = (payload) => {
  const title = typeof payload.title === 'string' ? payload.title.trim() : ''
  const summary = typeof payload.summary === 'string' ? payload.summary.trim() : ''
  const content = payload.content ?? payload.body
  const publishedAtRaw = payload.publishedAt || payload.date
  const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : null
  const slug = typeof payload.slug === 'string' ? payload.slug.trim() : ''
  const source = payload.source || ''

  if (!title) throw new HttpError(400, 'Payload inválido', 'title é obrigatório')
  if (!summary) throw new HttpError(400, 'Payload inválido', 'summary é obrigatório')
  if (!publishedAt || Number.isNaN(publishedAt.getTime())) throw new HttpError(400, 'Payload inválido', 'publishedAt é obrigatório')
  if (content === undefined) throw new HttpError(400, 'Payload inválido', 'content/body é obrigatório')

  const deterministicHash = crypto.createHash('sha256').update(`${title}:${publishedAt.toISOString()}:${source || ''}`).digest('hex')
  const baseSlug = slug || `${slugify(title)}-${deterministicHash.slice(0, 8)}`

  return {
    slug: slugify(baseSlug),
    title,
    summary,
    content,
    publishedAt,
  }
}

router.post(
  '/',
  requireScope('reports:write'),
  enforceTenantScope(),
  createRateLimitMiddleware({ prefix: 'reports:write', limit: config.RATE_LIMIT_REPORTS_WRITE }),
  idempotencyMiddleware(),
  async (req, res, next) => {
    try {
      const tenantId = req.params.tenantId
      const input = Array.isArray(req.body) ? req.body : [req.body]
      const normalized = input.map(normalizePayload)

      const result = await req.prisma.$transaction(async (tx) => {
        let created = 0
        let updated = 0
        const items = []

        for (const payload of normalized) {
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

          const action = saved.__isNew ? 'created' : 'updated'
          if (action === 'created') created += 1
          else updated += 1

          items.push({ id: saved.id, slug: saved.slug, action })

          await tx.outboxEvent.create({
            data: {
              tenantId,
              type: 'REPORT_PUBLISHED',
              payload: { reportId: saved.id, slug: saved.slug, title: saved.title },
              status: 'PENDING',
            },
          })
        }

        return { created, updated, items }
      })

      res.status(201).json({ total: normalized.length, ...result })
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
  async (req, res, next) => {
    try {
      const tenantId = req.params.tenantId
      const limit = Math.min(Number(req.query.limit) || 50, 200)
      const cursor = req.query.cursor

      const query = await req.prisma.report.findMany({
        where: { tenantId },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
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
  async (req, res, next) => {
    try {
      const tenantId = req.params.tenantId
      const latest = await req.prisma.report.findFirst({
        where: { tenantId },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      })

      if (!latest) return res.status(404).json({ message: 'Nenhum relatório encontrado' })
      res.json({ latest })
    } catch (err) {
      next(err)
    }
  },
)

export default router
