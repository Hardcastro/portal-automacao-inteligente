import config from '../server/config.js'
import { createMemoryQueueAdapter } from './adapters/memoryAdapter.js'
import { createBullMQAdapter } from './adapters/bullmqAdapter.js'
import { createSqsAdapter } from './adapters/sqsAdapter.js'

export const createQueueAdapter = () => {
  const driver = config.queue.driver
  if (driver === 'bullmq') {
    return createBullMQAdapter({ redisUrl: config.redisUrl, prefix: config.queue.prefix })
  }
  if (driver === 'sqs') {
    return createSqsAdapter()
  }
  return createMemoryQueueAdapter()
}
