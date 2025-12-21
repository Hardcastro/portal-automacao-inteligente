import express from '../shared/miniExpress.js'
import { contextMiddleware } from './middlewares/context.js'
import { authMiddleware } from './middlewares/auth.js'
import { errorHandler, notFoundHandler } from './middlewares/error.js'
import reportsRouter from './routes/reports.js'
import automationRouter from './routes/automation.js'
import webhookRouter from './routes/webhooks.js'
import healthRouter from './routes/health.js'
import { prisma } from '../shared/prisma.js'
import { getRedis } from '../shared/redis.js'

const app = express()

const attachClients = (req, _res, next) => {
  req.prisma = prisma
  req.redis = getRedis()
  next()
}

app.use(contextMiddleware)
const jsonParser = express.json({ limit: '1mb' })
app.use((req, res, next) => {
  if (req.url.startsWith('/v1/webhooks/activepieces/callback')) return next()
  return jsonParser(req, res, next)
})
app.use(attachClients)

const tenantRouter = express.Router({ mergeParams: true })
tenantRouter.use(authMiddleware(prisma))
tenantRouter.use('/reports', reportsRouter)
tenantRouter.use('/automation-runs', automationRouter)

app.use('/v1/tenants/:tenantId', tenantRouter)
app.use('/v1/webhooks', attachClients, webhookRouter)
app.use('/health', attachClients, healthRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
