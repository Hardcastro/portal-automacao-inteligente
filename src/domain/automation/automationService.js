import { randomUUID } from 'crypto'
import config from '../../server/config.js'
import { createActivepiecesClient } from '../../integrations/activepieces/activepiecesClient.js'
import { mapBlogAutomationPayload } from '../../integrations/activepieces/activepiecesMapper.js'

let cachedClient
let lastFetch

const getClient = () => {
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

export const triggerBlogAutomation = async ({ reports = [], requestId }) => {
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

  const correlationId = randomUUID()
  const payload = mapBlogAutomationPayload({ correlationId, reports })
  const client = getClient()
  const result = await client.triggerWebhook({
    url: config.activepieces.webhookBlogUrl,
    payload,
    requestId,
  })

  return { correlationId, result }
}
