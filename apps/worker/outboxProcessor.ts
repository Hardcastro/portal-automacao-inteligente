import type { Job, Worker } from 'bullmq'
import { Worker as BullWorker } from 'bullmq'
import { config } from '../shared/env.js'
import { createLogger } from '../shared/logger.js'
import { getPrisma } from '../shared/prismaClient.js'
import { getOutboxDlq, getOutboxQueue, isMemoryQueue } from '../shared/queues.js'
import { getRedis } from '../shared/redis.js'
import { RetryableError } from '../shared/retryableError.js'

const logger = createLogger({ module: 'outbox' })

type OutboxJobData = {
  eventId: string
}

type OutboxJob = Job<OutboxJobData> | { id: string; data: OutboxJobData; attempts: number; attemptsMade: number }

const shouldRetryStatus = (status: number) => status === 429 || status >= 500

const getMaxAttempts = (job: OutboxJob) => {
  if ('opts' in job && job.opts?.attempts) return job.opts.attempts
  if ('attempts' in job) return job.attempts
  return 1
}

const processOutboxJob = async (job: OutboxJob) => {
  const prisma = getPrisma()
  const dlq = getOutboxDlq()
  const eventId = job.data.eventId

  const event = await prisma.outboxEvent.findFirst({ where: { id: eventId } })
  if (!event) {
    logger.warn({ eventId }, 'Evento de outbox nao encontrado')
    return
  }

  await prisma.outboxEvent.update({
    where: { id: eventId },
    data: { status: 'PROCESSING', lockedAt: new Date(), attempts: { increment: 1 } },
  })

  try {
    if (!config.ACTIVEPIECES_WEBHOOK_BLOG_URL) {
      await prisma.outboxEvent.update({
        where: { id: eventId },
        data: { status: 'DELIVERED', lastError: 'Webhook nao configurado (dry-run)', lockedAt: null },
      })
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.ACTIVEPIECES_WEBHOOK_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(config.ACTIVEPIECES_WEBHOOK_BLOG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': `outbox-${event.id}`,
          'X-Correlation-Id': `outbox-${event.id}`,
          'X-Tenant-Id': event.tenantId,
        },
        body: JSON.stringify(event.payload),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok && shouldRetryStatus(response.status)) {
      await prisma.outboxEvent.update({
        where: { id: eventId },
        data: { status: 'PENDING', lastError: `HTTP ${response.status}`, lockedAt: null },
      })
      throw new RetryableError(`HTTP ${response.status}`, response.status)
    }

    if (!response.ok) {
      await prisma.outboxEvent.update({
        where: { id: eventId },
        data: { status: 'FAILED', lastError: `HTTP ${response.status}`, lockedAt: null },
      })
      await dlq.add('outbox', { eventId, error: `HTTP ${response.status}` })
      return
    }

    await prisma.outboxEvent.update({
      where: { id: eventId },
      data: { status: 'DELIVERED', lockedAt: null, nextRetryAt: null },
    })
  } catch (err) {
    if (err instanceof RetryableError) throw err

    await prisma.outboxEvent.update({
      where: { id: eventId },
      data: { status: 'FAILED', lastError: (err as Error).message, lockedAt: null },
    })
    await dlq.add('outbox', { eventId, error: (err as Error).message })
    logger.error({ err, eventId }, 'Falha ao processar outbox')
  }
}

export const startOutboxWorker = () => {
  const queue = getOutboxQueue()
  if (isMemoryQueue(queue)) {
    queue.onProcess(async (job) => processOutboxJob(job as OutboxJob))
    return { stop: async () => {} }
  }

  const worker: Worker<OutboxJobData> = new BullWorker('outbox', processOutboxJob, {
    connection: getRedis() as import('ioredis').Redis,
  })

  worker.on('failed', async (job, err) => {
    if (!job) return
    const maxAttempts = getMaxAttempts(job)
    if (job.attemptsMade >= maxAttempts) {
      const prisma = getPrisma()
      await prisma.outboxEvent.update({
        where: { id: job.data.eventId },
        data: { status: 'DEAD_LETTER', lastError: err.message, lockedAt: null },
      })
      const dlq = getOutboxDlq()
      await dlq.add('outbox', { eventId: job.data.eventId, error: err.message })
    }
  })

  return {
    stop: async () => {
      await worker.close()
    },
  }
}
