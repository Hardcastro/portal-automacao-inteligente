import { randomUUID } from 'crypto'
import { createLogger } from '../../shared/logger.js'
import type { NextFunction, RequestWithContext, ResponseLike } from '../../shared/types.js'

const logger = createLogger({ module: 'http' })

export const contextMiddleware = (req: RequestWithContext, res: ResponseLike, next: NextFunction) => {
  const requestId = req.get?.('x-request-id') || randomUUID()
  const correlationId = req.get?.('x-correlation-id')

  req.ctx = {
    requestId,
    correlationId: correlationId || null,
    startTime: process.hrtime.bigint(),
  }

  res.setHeader('X-Request-Id', requestId)
  if (correlationId) res.setHeader('X-Correlation-Id', correlationId)

  res.on?.('finish', () => {
    const end = process.hrtime.bigint()
    const latencyMs = Number(end - req.ctx.startTime) / 1e6
    logger.info(
      {
        requestId,
        correlationId,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        tenantId: req.ctx.tenantId,
        latencyMs: Number(latencyMs.toFixed(3)),
      },
      'request completed',
    )
  })

  next()
}
