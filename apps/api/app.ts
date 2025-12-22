import fs from 'node:fs'
import path from 'node:path'
import express from '../shared/miniExpress.js'
import { contextMiddleware } from './middlewares/context.js'
import { authMiddleware } from './middlewares/auth.js'
import { errorHandler, notFoundHandler } from './middlewares/error.js'
import reportsRouter from './routes/reports.js'
import automationRouter from './routes/automation.js'
import webhookRouter from './routes/webhooks.js'
import healthRouter from './routes/health.js'
import { getPrisma } from '../shared/prismaClient.js'
import { getRedis } from '../shared/redis.js'
import type { NextFunction, RequestWithContext, ResponseLike } from '../shared/types.js'

const app = express()

const staticRoot = path.resolve(process.cwd(), 'dist', 'client')
const hasStaticAssets = fs.existsSync(staticRoot)
const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
}

const serveStatic = async (req: RequestWithContext, res: ResponseLike, next: NextFunction) => {
  if (!hasStaticAssets) return next()
  const method = req.method || 'GET'
  if (method !== 'GET' && method !== 'HEAD') return next()
  const reqPath = req.path || '/'
  if (reqPath.startsWith('/v1') || reqPath.startsWith('/health')) return next()

  const safePath = path.resolve(staticRoot, `.${reqPath}`)
  if (!safePath.startsWith(staticRoot)) return next()

  const sendFile = async (filePath: string) => {
    const data = await fs.promises.readFile(filePath)
    const ext = path.extname(filePath)
    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream')
    res.status(200)
    if (method === 'HEAD') return res.send('')
    return res.send(data)
  }

  try {
    const stats = await fs.promises.stat(safePath)
    if (stats.isDirectory()) {
      return sendFile(path.join(safePath, 'index.html'))
    }
    return sendFile(safePath)
  } catch (_err) {
    try {
      return sendFile(path.join(staticRoot, 'index.html'))
    } catch (_fallbackErr) {
      return next()
    }
  }
}

const attachClients = (req: RequestWithContext, _res: ResponseLike, next: NextFunction) => {
  req.prisma = getPrisma()
  req.redis = getRedis()
  next()
}

app.use(contextMiddleware)
const jsonParser = express.json({ limit: '1mb' })
app.use((req: RequestWithContext, res: ResponseLike, next: NextFunction) => {
  if (req.url && req.url.startsWith('/v1/webhooks/activepieces/callback')) return next()
  return jsonParser(req, res, next)
})
app.use(serveStatic)
app.use(attachClients)

const tenantRouter = express.Router({ mergeParams: true })
tenantRouter.use(authMiddleware(getPrisma()))
tenantRouter.use('/reports', reportsRouter)
tenantRouter.use('/automation-runs', automationRouter)

app.use('/v1/tenants/:tenantId', tenantRouter)
app.use('/v1/webhooks', attachClients, webhookRouter)
app.use('/health', attachClients, healthRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
