import app from './app.js'
import { config } from '../shared/env.js'
import { logger } from '../shared/logger.js'
import { closePrisma, getPrisma } from '../shared/prismaClient.js'
import { closeRedis, getRedis } from '../shared/redis.js'
import { startAutomationWorker } from '../worker/automationProcessor.js'
import { startOutboxWorker } from '../worker/outboxProcessor.js'

const port = config.PORT || 3000

const server = app.listen(port, () => {
  logger.info({ port }, 'API iniciada')
})

const automationWorker = startAutomationWorker()
const outboxWorker = startOutboxWorker()

const shutdown = async () => {
  logger.info({}, 'Encerrando servidor...')
  server.close()
  await automationWorker.stop()
  await outboxWorker.stop()
  await closePrisma()
  await closeRedis()
  process.exit(0)
}

getPrisma()
getRedis()

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
