import { randomUUID } from 'crypto'

export const createMemoryQueueAdapter = () => {
  const handlers = new Map()
  const jobs = []

  const enqueue = async (name, data) => {
    const job = { id: randomUUID(), name, data }
    jobs.push(job)
    queueMicrotask(async () => {
      const handler = handlers.get(name)
      if (handler) {
        try {
          await handler(job)
        } catch (error) {
          console.error('Memory queue job failed', error)
        }
      }
    })
    return job
  }

  const process = (name, handler) => {
    handlers.set(name, handler)
  }

  return { enqueue, process }
}
