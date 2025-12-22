import { randomUUID } from 'node:crypto'
import { Queue } from 'bullmq'
import type { Redis } from 'ioredis'
import { config } from './env.js'
import { createLogger } from './logger.js'
import { getRedis } from './redis.js'

const logger = createLogger({ module: 'queue' })

type BackoffOptions = { type: 'exponential' | 'fixed'; delay: number }

type MemoryJob = {
  id: string
  data: Record<string, unknown>
  attempts: number
  attemptsMade: number
  backoff?: BackoffOptions | null
}

type MemoryHandler = (job: MemoryJob) => Promise<void>

class MemoryQueue {
  name: string
  jobs: MemoryJob[]
  listeners: MemoryHandler[]
  processing: boolean

  constructor(name: string) {
    this.name = name
    this.jobs = []
    this.listeners = []
    this.processing = false
  }

  async add(_name: string, data: Record<string, unknown>, options: { attempts?: number; backoff?: BackoffOptions } = {}) {
    const job: MemoryJob = {
      id: randomUUID(),
      data,
      attempts: options.attempts || 1,
      attemptsMade: 0,
      backoff: options.backoff || null,
    }
    this.jobs.push(job)
    this._drain()
    return job
  }

  onProcess(handler: MemoryHandler) {
    this.listeners.push(handler)
    this._drain()
  }

  async _processJob(job: MemoryJob) {
    for (const handler of this.listeners) {
      try {
        await handler(job)
      } catch (err) {
        job.attemptsMade += 1
        if (job.attemptsMade < job.attempts) {
          const delay = job.backoff?.delay || 1000
          setTimeout(() => this.jobs.push(job) && this._drain(), delay)
        } else {
          logger.error({ err, jobId: job.id, queue: this.name }, 'Job falhou')
        }
      }
    }
  }

  async _drain() {
    if (this.processing) return
    this.processing = true
    while (this.jobs.length) {
      const job = this.jobs.shift()
      if (job) await this._processJob(job)
    }
    this.processing = false
  }

  clear() {
    this.jobs = []
  }
}

export type QueueLike = Queue | MemoryQueue

const createQueue = (name: string): QueueLike => {
  if (config.USE_INMEMORY_STUBS) {
    return new MemoryQueue(name)
  }
  return new Queue(name, { connection: getRedis() as Redis })
}

let automationQueue: QueueLike | null = null
let outboxQueue: QueueLike | null = null
let outboxDlq: QueueLike | null = null
let automationDlq: QueueLike | null = null

export const getAutomationQueue = (): QueueLike => {
  if (!automationQueue) automationQueue = createQueue('automation')
  return automationQueue
}

export const getOutboxQueue = (): QueueLike => {
  if (!outboxQueue) outboxQueue = createQueue('outbox')
  return outboxQueue
}

export const getOutboxDlq = (): QueueLike => {
  if (!outboxDlq) outboxDlq = createQueue('outbox:dlq')
  return outboxDlq
}

export const getAutomationDlq = (): QueueLike => {
  if (!automationDlq) automationDlq = createQueue('automation:dlq')
  return automationDlq
}

export const isMemoryQueue = (queue: QueueLike): queue is MemoryQueue => queue instanceof MemoryQueue

export const resetQueues = (): void => {
  if (automationQueue && isMemoryQueue(automationQueue)) automationQueue.clear()
  if (outboxQueue && isMemoryQueue(outboxQueue)) outboxQueue.clear()
  if (outboxDlq && isMemoryQueue(outboxDlq)) outboxDlq.clear()
  if (automationDlq && isMemoryQueue(automationDlq)) automationDlq.clear()
}
