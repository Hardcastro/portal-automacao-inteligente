import { config } from '../shared/env.js'
import { logger } from '../shared/logger.js'
import { prisma } from '../shared/prisma.js'
import { getRedis } from '../shared/redis.js'
import { processOutbox } from './outboxProcessor.js'
import { startAutomationWorker } from './automationProcessor.js'

const redis = getRedis()
const automation = startAutomationWorker()

const loopOutbox = async () => {
  try {
    const processed = await processOutbox(prisma)
    if (processed > 0) {
      logger.info({ processed }, 'Outbox processada')
    }
  } catch (err) {
    logger.error({ err }, 'Erro no processamento de outbox')
  } finally {
    setTimeout(loopOutbox, 3000)
  }
}

loopOutbox()

const shutdown = async () => {
  logger.info('Encerrando worker...')
  if (automation.stop) await automation.stop()
  await prisma.$disconnect()
  if (redis?.disconnect) await redis.disconnect()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

logger.info({ env: config.NODE_ENV }, 'Worker iniciado')
