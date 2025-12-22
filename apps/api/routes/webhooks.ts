import crypto from 'node:crypto'
import { z } from 'zod'
import express from '../../shared/miniExpress.js'
import { config } from '../../shared/env.js'
import { HttpError } from '../../shared/httpError.js'
import { createRateLimitMiddleware } from '../middlewares/rateLimit.js'
import type { NextFunction, RequestWithContext, ResponseLike } from '../../shared/types.js'

const router = express.Router({ mergeParams: true })

const verifySignature = (rawBody: string, timestamp: string, nonce: string, signature: string | undefined) => {
  if (!config.ACTIVEPIECES_CALLBACK_SIGNING_SECRET) throw new HttpError(500, 'Segredo de assinatura ausente')
  const payload = `${timestamp}.${nonce}.${rawBody}`
  const expected = crypto.createHmac('sha256', config.ACTIVEPIECES_CALLBACK_SIGNING_SECRET).update(payload).digest('hex')

  const safeExpected = Buffer.from(expected)
  const safeSignature = Buffer.from(signature || '')
  if (safeExpected.length !== safeSignature.length) return false
  return crypto.timingSafeEqual(safeExpected, safeSignature)
}

const CallbackSchema = z.object({
  correlationId: z.string().optional(),
  providerRunId: z.string().optional(),
  status: z.string().optional(),
  output: z.any().optional(),
  tenantId: z.string().optional(),
})

type CallbackInput = z.infer<typeof CallbackSchema>

router.use(
  '/activepieces/callback',
  express.json({
    verify: (req: RequestWithContext, _res: ResponseLike, buf: Buffer) => {
      req.rawBody = buf?.toString('utf8') || ''
    },
  }),
)

router.post(
  '/activepieces/callback',
  createRateLimitMiddleware({ prefix: 'webhook', limit: config.RATE_LIMIT_WEBHOOK }),
  async (req: RequestWithContext, res: ResponseLike, next: NextFunction) => {
    try {
      const signature = req.get?.('x-signature')
      const timestampHeader = req.get?.('x-timestamp')
      const nonce = req.get?.('x-nonce')

      if (!signature || !timestampHeader || !nonce) {
        throw new HttpError(401, 'Cabecalhos de assinatura ausentes')
      }

      const timestampMs = Number(timestampHeader) * 1000
      const skewSeconds = config.CALLBACK_TIMESTAMP_SKEW_SECONDS
      if (Number.isNaN(timestampMs) || Math.abs(Date.now() - timestampMs) > skewSeconds * 1000) {
        throw new HttpError(401, 'Timestamp invalido ou fora da janela permitida')
      }

      if (!verifySignature(req.rawBody || '', timestampHeader, nonce, signature)) {
        throw new HttpError(401, 'Assinatura invalida')
      }

      if (!req.redis) throw new HttpError(500, 'Redis nao configurado')
      if (!req.prisma) throw new HttpError(500, 'Prisma nao configurado')

      const payload: CallbackInput = CallbackSchema.parse(req.body || {})
      const tenantKey = payload.tenantId || 'unknown'
      const nonceKey = `nonce:${tenantKey}:${nonce}`
      const stored = await (req.redis as any).set(nonceKey, '1', 'NX', 'EX', 600)
      if (!stored) throw new HttpError(409, 'Requisicao de webhook ja processada')

      if (!payload.correlationId && !payload.providerRunId) throw new HttpError(400, 'correlationId ou providerRunId sao obrigatorios')

      const run = await req.prisma.automationRun.findFirst({
        where: {
          ...(payload.correlationId ? { correlationId: payload.correlationId } : {}),
          ...(payload.providerRunId ? { providerRunId: payload.providerRunId } : {}),
          ...(payload.tenantId ? { tenantId: payload.tenantId } : {}),
        },
      })

      if (!run) throw new HttpError(404, 'Execucao nao encontrada para callback')

      const normalizedStatus =
        payload.status === 'succeeded' || payload.status === 'success'
          ? 'SUCCEEDED'
          : payload.status === 'failed'
            ? 'FAILED'
            : 'RUNNING'

      await req.prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: normalizedStatus,
          output: payload.output || null,
          providerRunId: payload.providerRunId || run.providerRunId,
        },
      })

      res.json({ ok: true })
    } catch (err) {
      next(err)
    }
  },
)

export default router
