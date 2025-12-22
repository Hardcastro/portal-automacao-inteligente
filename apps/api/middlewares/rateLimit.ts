import { HttpError } from '../../shared/httpError.js'
import { config } from '../../shared/env.js'
import { getRedis } from '../../shared/redis.js'
import type { NextFunction, RequestWithContext, ResponseLike } from '../../shared/types.js'

const windowSeconds = config.RATE_LIMIT_WINDOW_SECONDS

export const createRateLimitMiddleware = ({ prefix, limit }: { prefix: string; limit: number }) => {
  const redis = getRedis()

  return async (req: RequestWithContext, res: ResponseLike, next: NextFunction) => {
    const tenant = req.auth?.tenantId || req.params?.tenantId || 'anonymous'
    const key = `${prefix}:${tenant}`
    try {
      const current = await redis.incr(key)
      if (current === 1) await redis.expire(key, windowSeconds)

      if (current > limit) {
        res.setHeader('Retry-After', windowSeconds)
        return next(new HttpError(429, 'Rate limit excedido', `Limite de ${limit} requisicoes por janela`))
      }
    } catch (_err) {
      // Nao bloquear em caso de falha de Redis, apenas logar.
      return next()
    }

    return next()
  }
}
