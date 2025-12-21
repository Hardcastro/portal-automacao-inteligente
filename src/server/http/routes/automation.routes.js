import { createRateLimiter } from '../middlewares/rateLimit.js'
import config from '../../config.js'
import { triggerBlogAutomation } from '../../../domain/automation/automationService.js'

const rateLimiter = createRateLimiter(config.automationRateLimit)

export const registerAutomationRoutes = (app) => {
  app.post('/api/automation/blog', rateLimiter, async (req, res, next) => {
    const body = req.body || {}
    const reports = Array.isArray(body.reports) ? body.reports : []

    try {
      const { correlationId } = await triggerBlogAutomation({ reports, requestId: req.requestId })
      return res.status(202).json({ ok: true, correlationId, requestId: req.requestId })
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message, requestId: req.requestId })
      }
      return next(error)
    }
  })
}
