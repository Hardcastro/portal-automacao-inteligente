import crypto from 'node:crypto'
import { z } from 'zod'
import express from '../../shared/miniExpress.js'
import { enforceTenantScope, requireAnyScope, requireScope } from '../middlewares/auth.js'
import { idempotencyMiddleware } from '../middlewares/idempotency.js'
import { createRateLimitMiddleware } from '../middlewares/rateLimit.js'
import { HttpError } from '../../shared/httpError.js'
import { getAutomationQueue } from '../../shared/queues.js'
import { config } from '../../shared/env.js'
import type { NextFunction, RequestWithContext, ResponseLike } from '../../shared/types.js'

const router = express.Router({ mergeParams: true })

const AutomationInputSchema = z.object({
  input: z.record(z.any()).optional(),
})

type AutomationInput = z.infer<typeof AutomationInputSchema>

router.post(
  '/',
  requireScope('automation:trigger'),
  enforceTenantScope(),
  createRateLimitMiddleware({ prefix: 'automation', limit: config.RATE_LIMIT_AUTOMATION }),
  idempotencyMiddleware(),
  async (req: RequestWithContext, res: ResponseLike, next: NextFunction) => {
    try {
      const tenantId = req.params?.tenantId
      if (!tenantId) throw new HttpError(400, 'Tenant nao informado')
      if (!req.prisma) throw new HttpError(500, 'Prisma nao configurado')

      const payload: AutomationInput = AutomationInputSchema.parse(req.body || {})
      const correlationId = crypto.randomUUID()
      req.ctx.correlationId = correlationId

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
        { attempts: 8, backoff: { type: 'exponential', delay: 2000 } },
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
  async (req: RequestWithContext, res: ResponseLike, next: NextFunction) => {
    try {
      const tenantId = req.params?.tenantId
      const runId = req.params?.runId
      if (!tenantId || !runId) throw new HttpError(400, 'Parametros invalidos')
      if (!req.prisma) throw new HttpError(500, 'Prisma nao configurado')

      const run = await req.prisma.automationRun.findFirst({
        where: { id: runId, tenantId },
        select: { id: true, status: true, correlationId: true, output: true, error: true, providerRunId: true },
      })

      if (!run) return next(new HttpError(404, 'Execucao nao encontrada'))
      res.json(run)
    } catch (err) {
      next(err)
    }
  },
)

export default router
