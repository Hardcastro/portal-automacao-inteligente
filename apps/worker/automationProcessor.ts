import type { Job, Worker } from 'bullmq'
import { Worker as BullWorker } from 'bullmq'
import type { Prisma } from '@prisma/client'
import { config } from '../shared/env.js'
import { createLogger } from '../shared/logger.js'
import { getPrisma } from '../shared/prismaClient.js'
import { getAutomationDlq, getAutomationQueue, isMemoryQueue } from '../shared/queues.js'
import { getRedis } from '../shared/redis.js'
import { RetryableError } from '../shared/retryableError.js'

const logger = createLogger({ module: 'automation-worker' })

type AutomationJobData = {
  tenantId: string
  runId: string
  correlationId: string
  input?: Record<string, unknown>
}

type AutomationJob = Job<AutomationJobData> | { id: string; data: AutomationJobData; attempts: number; attemptsMade: number }

const executeAutomation = async ({ runId, correlationId, input }: AutomationJobData) => {
  const output = {
    correlationId,
    receivedAt: new Date().toISOString(),
    echo: input || {},
  }

  const prisma = getPrisma()
  await prisma.automationRun.update({
    where: { id: runId },
    data: { status: 'SUCCEEDED', output: output as Prisma.InputJsonValue, providerRunId: correlationId },
  })
  return output
}

const getMaxAttempts = (job: AutomationJob) => {
  if ('opts' in job && job.opts?.attempts) return job.opts.attempts
  if ('attempts' in job) return job.attempts
  return 1
}

const shouldRetry = (err: unknown) => {
  const status = (err as { status?: number; statusCode?: number })?.status ?? (err as { statusCode?: number })?.statusCode
  return status === 429 || (typeof status === 'number' && status >= 500)
}

const processJob = async (job: AutomationJob) => {
  const prisma = getPrisma()
  const dlq = getAutomationDlq()
  const { tenantId, runId } = job.data

  try {
    await prisma.automationRun.update({
      where: { id: runId },
      data: { status: 'RUNNING' },
    })
    await executeAutomation(job.data)
    logger.info({ jobId: job.id, runId }, 'Automacao concluida')
  } catch (err) {
    if (shouldRetry(err)) {
      throw new RetryableError('Automation retryable failure', (err as { status?: number })?.status)
    }
    logger.error({ err, jobId: job.id, runId }, 'Automacao falhou')
    await prisma.automationRun.update({
      where: { id: runId },
      data: { status: 'FAILED', error: { message: (err as Error).message } as Prisma.InputJsonValue },
    })
    await dlq.add('automation', { ...job.data, error: (err as Error).message })
  }
}

export const startAutomationWorker = () => {
  const queue = getAutomationQueue()
  if (isMemoryQueue(queue)) {
    queue.onProcess(async (job) => processJob(job as AutomationJob))
    return { stop: async () => {} }
  }

  const worker: Worker<AutomationJobData> = new BullWorker('automation', processJob, {
    connection: getRedis() as import('ioredis').Redis,
    concurrency: config.AUTOMATION_QUEUE_CONCURRENCY,
  })

  worker.on('failed', async (job, err) => {
    if (!job) return
    const maxAttempts = getMaxAttempts(job)
    if (job.attemptsMade >= maxAttempts) {
      const prisma = getPrisma()
      await prisma.automationRun.update({
        where: { id: job.data.runId },
        data: { status: 'DEAD_LETTER', error: { message: err.message } as Prisma.InputJsonValue },
      })
      const dlq = getAutomationDlq()
      await dlq.add('automation', { ...job.data, error: err.message })
    }
  })

  return {
    stop: async () => {
      await worker.close()
    },
  }
}
