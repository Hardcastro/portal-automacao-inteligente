import app from './app.js'
import { config } from '../shared/env.js'
import { logger } from '../shared/logger.js'
import { prisma } from '../shared/prisma.js'
import { getRedis } from '../shared/redis.js'

const port = config.PORT || 3000

const server = app.listen(port, () => {
  logger.info({ port }, 'API iniciada')
})

const shutdown = async () => {
  logger.info('Encerrando servidor...')
  server.close()
  await prisma.$disconnect()
  const redis = getRedis()
  if (redis?.disconnect) await redis.disconnect()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
