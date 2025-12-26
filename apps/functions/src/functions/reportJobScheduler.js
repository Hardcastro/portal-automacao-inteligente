import { app } from '@azure/functions'
import { queueServiceClient } from '../shared/clients.js'
import { config } from '../shared/config.js'

const enqueueJob = async (payload) => {
  const queue = queueServiceClient.getQueueClient(config.reportsQueue)
  await queue.createIfNotExists()
  await queue.sendMessage(Buffer.from(JSON.stringify(payload)).toString('base64'))
}

app.timer('reportJobScheduler', {
  schedule: '0 0 8 * * *',
  handler: async (context) => {
    const today = new Date().toISOString().slice(0, 10)
    const payload = {
      jobId: `daily-${today}`,
      reportDate: today,
      topic: 'relatorio-diario',
      version: 'v1',
      correlationId: `daily-${today}`,
      idempotencyKey: `${today}:relatorio-diario:v1`,
    }
    await enqueueJob(payload)
    context.log('enqueued daily job', payload)
  },
})
