import express from '../../shared/miniExpress.js'
import { HttpError } from '../../shared/httpError.js'
import type { RequestWithContext, ResponseLike } from '../../shared/types.js'

const router = express.Router()

router.get('/healthz', (_req: RequestWithContext, res: ResponseLike) => {
  res.json({ status: 'ok' })
})

router.get('/readyz', async (req: RequestWithContext, res: ResponseLike) => {
  try {
    if (!req.prisma) throw new HttpError(500, 'Prisma nao configurado')
    if (!req.redis) throw new HttpError(500, 'Redis nao configurado')
    await req.prisma.$queryRaw`SELECT 1`
    await req.redis.ping()
    res.json({ status: 'ready' })
  } catch (err) {
    res.status(503).json({ status: 'degraded', error: (err as Error).message })
  }
})

export default router
