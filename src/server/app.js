import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import config from './config.js'
import { requestIdMiddleware } from './http/middlewares/requestId.js'
import { securityHeaders } from './http/middlewares/securityHeaders.js'
import { requestLogger } from './http/middlewares/requestLogger.js'
import { errorHandler } from './http/middlewares/errorHandler.js'
import { registerReportsRoutes } from './http/routes/reports.routes.js'
import { registerHealthRoutes } from './http/routes/health.routes.js'
import { registerAutomationRoutes } from './http/routes/automation.routes.js'
import { createStaticHandler } from './http/middlewares/staticHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..', '..')
const DIST_DIR = config.distDir || path.join(ROOT_DIR, 'dist')

export const createApp = () => {
  const app = express()

  app.use(requestIdMiddleware)
  app.use(requestLogger(console))
  app.use(express.json({ limit: config.payloadLimit, type: 'application/json' }))
  app.use(securityHeaders)

  registerHealthRoutes(app)
  registerReportsRoutes(app)
  registerAutomationRoutes(app)

  app.use(createStaticHandler({ publicDir: config.publicDir, distDir: DIST_DIR }))
  app.use(errorHandler)

  return app
}
