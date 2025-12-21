import { createLogger } from '../shared/logger.js'
import { prisma } from '../shared/prisma.js'
import { getAutomationDlq, getAutomationQueue } from '../shared/queues.js'

const logger = createLogger({ module: 'automation-worker' })

const executeAutomation = async ({ tenantId, runId, correlationId, input }) => {
  const output = {
    correlationId,
    receivedAt: new Date().toISOString(),
    echo: input || {},
  }

  await prisma.automationRun.update({
    where: { id: runId },
    data: { status: 'SUCCEEDED', output, providerRunId: correlationId },
  })
  return output
}

export const startAutomationWorker = () => {
  const queue = getAutomationQueue()
  const dlq = getAutomationDlq()

  queue.onProcess(async (job) => {
    const { tenantId, runId, correlationId, input } = job.data
    try {
      await prisma.automationRun.update({
        where: { id: runId },
        data: { status: 'RUNNING' },
      })
      await executeAutomation({ tenantId, runId, correlationId, input })
      logger.info({ jobId: job.id, runId }, 'Automação concluída')
    } catch (err) {
      logger.error({ err, jobId: job.id, runId }, 'Automação falhou')
      await prisma.automationRun.update({
        where: { id: runId },
        data: { status: 'FAILED', error: { message: err.message } },
      })
      await dlq.add('automation', { ...job.data, error: err.message })
    }
  })

  return { stop: async () => {} }
}
