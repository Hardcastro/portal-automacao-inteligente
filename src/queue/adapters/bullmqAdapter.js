let BullMQ
try {
  BullMQ = await import('bullmq')
} catch {
  BullMQ = null
}

export const createBullMQAdapter = ({ redisUrl, prefix = 'pai' } = {}) => {
  if (!BullMQ) {
    throw new Error('BullMQ dependency is not available')
  }
  const { Queue, Worker, QueueEvents } = BullMQ

  const connection = { connection: { url: redisUrl }, prefix }
  const queue = new Queue('automation', connection)
  const queueEvents = new QueueEvents('automation', connection)

  const enqueue = async (name, data) => {
    await queue.waitUntilReady()
    return queue.add(name, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    })
  }

  const process = (name, handler) => {
    const worker = new Worker('automation', async (job) => handler(job), {
      ...connection,
      concurrency: 5,
    })

    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed`, err)
    })

    return worker
  }

  return { enqueue, process, queueEvents }
}
