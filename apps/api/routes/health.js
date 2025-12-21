import express from '../../shared/miniExpress.js'

const router = express.Router()

router.get('/healthz', (req, res) => {
  res.json({ status: 'ok' })
})

router.get('/readyz', async (req, res) => {
  try {
    await req.prisma.$queryRaw`SELECT 1`
    await req.redis.ping()
    res.json({ status: 'ready' })
  } catch (err) {
    res.status(503).json({ status: 'degraded', error: err.message })
  }
})

export default router
