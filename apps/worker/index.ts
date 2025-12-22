import { config } from '../shared/env.js'
import { logger } from '../shared/logger.js'
import { closePrisma, getPrisma } from '../shared/prismaClient.js'
import { closeRedis, getRedis } from '../shared/redis.js'
import { startAutomationWorker } from './automationProcessor.js'
import { startOutboxWorker } from './outboxProcessor.js'

getPrisma()
getRedis()

const automation = startAutomationWorker()
const outbox = startOutboxWorker()

const shutdown = async () => {
  logger.info({}, 'Encerrando worker...')
  await automation.stop()
  await outbox.stop()
  await closePrisma()
  await closeRedis()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

logger.info({ env: config.NODE_ENV }, 'Worker iniciado')
