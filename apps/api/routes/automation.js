import crypto from 'node:crypto'
import express from '../../shared/miniExpress.js'
import { enforceTenantScope, requireAnyScope, requireScope } from '../middlewares/auth.js'
import { idempotencyMiddleware } from '../middlewares/idempotency.js'
import { createRateLimitMiddleware } from '../middlewares/rateLimit.js'
import { HttpError } from '../../shared/errors.js'
import { getAutomationQueue } from '../../shared/queues.js'
import { config } from '../../shared/env.js'

const router = express.Router({ mergeParams: true })

router.post(
  '/',
  requireScope('automation:trigger'),
  enforceTenantScope(),
  createRateLimitMiddleware({ prefix: 'automation', limit: config.RATE_LIMIT_AUTOMATION }),
  idempotencyMiddleware(),
  async (req, res, next) => {
    try {
      const tenantId = req.params.tenantId
      const payload = req.body && typeof req.body === 'object' ? req.body : {}

      const correlationId = crypto.randomUUID()
      req.context.correlationId = correlationId

      const run = await req.prisma.automationRun.create({
        data: {
          tenantId,
          correlationId,
          status: 'QUEUED',
          input: payload.input || {},
        },
      })

      const queue = getAutomationQueue()
      await queue.add(
        'automation',
        { tenantId, runId: run.id, correlationId, input: payload.input || {} },
        { attempts: 5, backoff: { type: 'exponential', delay: 2000 } },
      )

      res.status(202).json({ runId: run.id, correlationId })
    } catch (err) {
      next(err)
    }
  },
)

router.get(
  '/:runId',
  requireAnyScope(['automation:trigger', 'reports:read']),
  enforceTenantScope(),
  createRateLimitMiddleware({ prefix: 'automation', limit: config.RATE_LIMIT_AUTOMATION }),
  async (req, res, next) => {
    try {
      const tenantId = req.params.tenantId
      const runId = req.params.runId

      const run = await req.prisma.automationRun.findFirst({
        where: { id: runId, tenantId },
        select: { id: true, status: true, correlationId: true, output: true, error: true, providerRunId: true },
      })

      if (!run) return next(new HttpError(404, 'Execução não encontrada'))
      res.json(run)
    } catch (err) {
      next(err)
    }
  },
)

export default router
