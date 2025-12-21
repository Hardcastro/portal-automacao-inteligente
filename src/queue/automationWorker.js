import { createActivepiecesClient } from '../integrations/activepieces/activepiecesClient.js'
import { mapBlogAutomationPayload } from '../integrations/activepieces/activepiecesMapper.js'
import { updateAutomationRunStatus } from '../../data/automationRunStore.js'

let cachedClient
let lastFetch

const getClient = (config) => {
  if (!cachedClient || lastFetch !== global.fetch) {
    cachedClient = createActivepiecesClient({
      signingSecret: config.activepieces.signingSecret,
      timeoutMs: config.activepieces.timeoutMs,
      retryMax: config.activepieces.retryMax,
      allowedHostnames: config.activepieces.allowedHostnames,
      fetchImpl: global.fetch,
    })
    lastFetch = global.fetch
  }
  return cachedClient
}

export const getAutomationWorker = (queueAdapter, config) => {
  queueAdapter.process('activepieces.trigger', async (job) => {
    const { correlationId, reports } = job.data
    await updateAutomationRunStatus(correlationId, 'running')

    try {
      const payload = mapBlogAutomationPayload({ correlationId, reports: reports || [] })
      const client = getClient(config)
      const response = await client.triggerWebhook({
        url: config.activepieces.webhookBlogUrl,
        payload,
        requestId: job.id,
      })

      const output = response?.data || { status: response?.status, ok: response?.ok }
      const nextStatus = response?.ok ? 'succeeded' : 'failed'
      await updateAutomationRunStatus(correlationId, nextStatus, { output })
    } catch (error) {
      await updateAutomationRunStatus(correlationId, 'failed', {
        output: { error: error?.message || 'Unknown error' },
      })
      throw error
    }
  })

  return queueAdapter
}
