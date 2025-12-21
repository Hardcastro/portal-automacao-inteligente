import crypto from 'node:crypto'
import express from '../../shared/miniExpress.js'
import { config } from '../../shared/env.js'
import { HttpError } from '../../shared/errors.js'
import { createRateLimitMiddleware } from '../middlewares/rateLimit.js'

const router = express.Router({ mergeParams: true })

const verifySignature = (rawBody, timestamp, nonce, signature) => {
  if (!config.ACTIVEPIECES_CALLBACK_SIGNING_SECRET) throw new HttpError(500, 'Segredo de assinatura ausente')
  const payload = `${timestamp}.${nonce}.${rawBody}`
  const expected = crypto.createHmac('sha256', config.ACTIVEPIECES_CALLBACK_SIGNING_SECRET).update(payload).digest('hex')

  const safeExpected = Buffer.from(expected)
  const safeSignature = Buffer.from(signature || '')
  if (safeExpected.length !== safeSignature.length) return false
  return crypto.timingSafeEqual(safeExpected, safeSignature)
}

router.use(
  '/activepieces/callback',
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf?.toString('utf8') || ''
    },
  }),
)

router.post(
  '/activepieces/callback',
  createRateLimitMiddleware({ prefix: 'webhook', limit: config.RATE_LIMIT_WEBHOOK }),
  async (req, res, next) => {
    try {
      const signature = req.get('x-signature')
      const timestampHeader = req.get('x-timestamp')
      const nonce = req.get('x-nonce')

      if (!signature || !timestampHeader || !nonce) {
        throw new HttpError(401, 'Cabeçalhos de assinatura ausentes')
      }

      const timestampMs = Number(timestampHeader) * 1000
      const skewSeconds = config.CALLBACK_TIMESTAMP_SKEW_SECONDS
      if (Number.isNaN(timestampMs) || Math.abs(Date.now() - timestampMs) > skewSeconds * 1000) {
        throw new HttpError(401, 'Timestamp inválido ou fora da janela permitida')
      }

      if (!verifySignature(req.rawBody, timestampHeader, nonce, signature)) {
        throw new HttpError(401, 'Assinatura inválida')
      }

      const redis = req.redis
      const nonceKey = `webhook:nonce:${nonce}`
      const stored = await redis.set(nonceKey, '1', 'NX', 'EX', Math.max(60, skewSeconds))
      if (!stored) throw new HttpError(409, 'Requisição de webhook já processada')

      const { correlationId, providerRunId, status, output, tenantId } = req.body || {}
      if (!correlationId && !providerRunId) throw new HttpError(400, 'correlationId ou providerRunId são obrigatórios')

      const run = await req.prisma.automationRun.findFirst({
        where: {
          ...(correlationId ? { correlationId } : {}),
          ...(providerRunId ? { providerRunId } : {}),
          ...(tenantId ? { tenantId } : {}),
        },
      })

      if (!run) throw new HttpError(404, 'Execução não encontrada para callback')

      const normalizedStatus =
        status === 'succeeded' || status === 'success'
          ? 'SUCCEEDED'
          : status === 'failed'
            ? 'FAILED'
            : 'RUNNING'

      await req.prisma.automationRun.update({
        where: { id: run.id },
        data: { status: normalizedStatus, output: output || null, providerRunId: providerRunId || run.providerRunId },
      })

      res.json({ ok: true })
    } catch (err) {
      next(err)
    }
  },
)

export default router
