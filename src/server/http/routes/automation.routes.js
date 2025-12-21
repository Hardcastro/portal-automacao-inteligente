import { createRateLimiter } from '../middlewares/rateLimit.js'
import config from '../../config.js'
import { getOrCreateAutomationRun } from '../../../domain/automation/automationService.js'
import { createHmacValidator } from '../validators/hmacValidator.js'
import { updateAutomationStatus } from '../../../domain/automation/automationService.js'

const rateLimiter = createRateLimiter(config.automationRateLimit)
const validateHmac = createHmacValidator({ secret: config.activepieces.callbackSigningSecret })

export const registerAutomationRoutes = (app) => {
  app.post('/api/automation/blog', rateLimiter, async (req, res, next) => {
    const body = req.body || {}
    const reports = Array.isArray(body.reports) ? body.reports : []
    const idempotencyKey = req.headers['idempotency-key'] || null

    try {
      const { correlationId, status, idempotent } = await getOrCreateAutomationRun({
        reports,
        idempotencyKey,
      })
      return res.status(202).json({ ok: true, correlationId, status, idempotent, requestId: req.requestId })
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message, requestId: req.requestId })
      }
      return next(error)
    }
  })

  app.post('/api/automation/status', validateHmac, async (req, res, next) => {
    try {
      const { correlationId, status, output, providerRunId } = req.body || {}
      if (!correlationId || !status) {
        return res.status(400).json({ error: 'correlationId e status são obrigatórios', requestId: req.requestId })
      }

      const updated = await updateAutomationStatus({ correlationId, status, output, providerRunId })
      if (!updated) {
        return res.status(404).json({ error: 'Automação não encontrada', requestId: req.requestId })
      }

      return res.status(200).json({ ok: true, requestId: req.requestId })
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message, requestId: req.requestId })
      }
      return next(error)
    }
  })
}
