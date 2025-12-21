import { randomUUID } from 'node:crypto'
import { createLogger } from './logger.js'

const logger = createLogger({ module: 'queue-memory' })

class MemoryQueue {
  constructor(name) {
    this.name = name
    this.jobs = []
    this.listeners = []
    this.processing = false
  }

  async add(_name, data, options = {}) {
    const job = {
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

  onProcess(handler) {
    this.listeners.push(handler)
    this._drain()
  }

  async _processJob(job) {
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
      await this._processJob(job)
    }
    this.processing = false
  }

  clear() {
    this.jobs = []
  }
}

const automationQueue = new MemoryQueue('automation')
const outboxDlq = new MemoryQueue('outbox:dlq')
const automationDlq = new MemoryQueue('automation:dlq')

export const getAutomationQueue = () => automationQueue
export const getOutboxDlq = () => outboxDlq
export const getAutomationDlq = () => automationDlq

export const resetQueues = () => {
  automationQueue.clear()
  outboxDlq.clear()
  automationDlq.clear()
}
