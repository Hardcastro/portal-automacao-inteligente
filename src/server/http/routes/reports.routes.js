import { createRequireAuth } from '../middlewares/requireAuth.js'
import { requireJsonContent } from '../middlewares/requireJsonContent.js'
import config from '../../config.js'
import { findReport, listReports, publishReports } from '../../../domain/reports/reportService.js'

const authMiddleware = createRequireAuth(config.reportsSecret)

export const registerReportsRoutes = (app) => {
  app.post('/api/reports', authMiddleware, requireJsonContent, async (req, res, next) => {
    try {
      const response = await publishReports({
        body: req.body,
        idempotencyKey: req.headers['idempotency-key'],
      })
      return res.status(201).json({ ...response, requestId: req.requestId })
    } catch (error) {
      if (error?.status) {
        return res.status(error.status).json({ error: error.message, requestId: req.requestId })
      }
      return next(error)
    }
  })

  app.get('/api/reports', (req, res) => {
    const payload = listReports(req.query.limit)

    return res.status(200).json({
      reports: payload.reports,
      meta: payload.meta,
      requestId: req.requestId,
    })
  })

  app.get('/api/reports/:slug', (req, res) => {
    const { slug } = req.params
    const report = findReport(slug)
    if (!report) {
      return res.status(404).json({ error: 'Relatório não encontrado', requestId: req.requestId })
    }

    return res.status(200).json(report)
  })
}
