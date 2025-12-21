import { randomUUID } from 'crypto'
import config from '../../server/config.js'
import { createIdempotencyStore } from '../../infrastructure/idempotency/index.js'
import {
  createAutomationRun,
  findAutomationRunByCorrelation,
  updateAutomationRunStatus,
} from '../../../data/automationRunStore.js'
import { getQueueAdapter } from '../../queue/automationQueue.js'

const idempotencyStore = createIdempotencyStore({
  redisUrl: config.redisUrl,
  ttlMs: config.idempotency.ttlMs,
})

export const getOrCreateAutomationRun = async ({ reports = [], idempotencyKey }) => {
  if (!config.activepieces.webhookBlogUrl) {
    const error = new Error('Webhook do Activepieces não configurado')
    error.status = 503
    throw error
  }

  if (!config.activepieces.signingSecret) {
    const error = new Error('Segredo de assinatura do Activepieces não configurado')
    error.status = 503
    throw error
  }

  const cached = await idempotencyStore.getResult(idempotencyKey)
  if (cached) {
    return { ...cached, idempotent: true }
  }

  const claimResult = await idempotencyStore.claim(idempotencyKey, config.idempotency.ttlMs)
  if (claimResult?.result) {
    return { ...claimResult.result, idempotent: true }
  }

  const correlationId = randomUUID()
  const run = await createAutomationRun({
    type: 'blog',
    input: { reports },
    correlationId,
    idempotencyKey: idempotencyKey || null,
  })

  const queue = getQueueAdapter()
  await queue.enqueue('activepieces.trigger', { correlationId, reports })

  const response = { correlationId, status: 'queued' }
  await idempotencyStore.storeResult(idempotencyKey, response, config.idempotency.ttlMs)

  return response
}

export const updateAutomationStatus = async ({ correlationId, status, output, providerRunId }) => {
  const updated = await updateAutomationRunStatus(correlationId, status, { output, providerRunId })
  return updated
}

export const findAutomationRun = (correlationId) => findAutomationRunByCorrelation(correlationId)
