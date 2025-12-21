import { HttpError } from '../../shared/errors.js'
import { config } from '../../shared/env.js'
import { getRedis } from '../../shared/redis.js'

const windowSeconds = config.RATE_LIMIT_WINDOW_SECONDS

export const createRateLimitMiddleware = ({ prefix, limit }) => {
  const redis = getRedis()

  return async (req, res, next) => {
    const tenant = req.auth?.tenantId || req.params?.tenantId || 'anonymous'
    const key = `${prefix}:${tenant}`
    try {
      const current = await redis.incr(key)
      if (current === 1) await redis.expire(key, windowSeconds)

      if (current > limit) {
        res.setHeader('Retry-After', windowSeconds)
        return next(new HttpError(429, 'Rate limit excedido', `Limite de ${limit} requisições por janela`))
      }
    } catch (err) {
      // Não bloquear em caso de falha de Redis, apenas logar
      return next()
    }

    return next()
  }
}
