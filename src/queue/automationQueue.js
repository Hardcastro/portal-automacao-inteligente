import config from '../server/config.js'
import { createQueueAdapter } from './queueFactory.js'
import { getAutomationWorker } from './automationWorker.js'

let adapter

export const getQueueAdapter = () => {
  if (!adapter) {
    adapter = createQueueAdapter()
  }
  return adapter
}

export const bootstrapAutomationQueue = () => {
  const queue = getQueueAdapter()
  getAutomationWorker(queue, config)
  return queue
}
