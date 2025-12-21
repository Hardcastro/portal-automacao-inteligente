import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..', '..')

const resolvePathFromRoot = (value, fallback) => {
  if (!value) return fallback
  return path.isAbsolute(value) ? value : path.resolve(ROOT_DIR, value)
}

const parsePort = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

const parseList = (value, fallback = []) => {
  if (!value) return fallback
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

const config = {
  port: parsePort(process.env.PORT, 3000),
  payloadLimit: process.env.PAYLOAD_LIMIT || '2mb',
  reportsSecret: process.env.REPORTS_SECRET_TOKEN || '',
  enablePublicSnapshot: process.env.ENABLE_REPORTS_SNAPSHOT === 'true',
  dataDir: resolvePathFromRoot(process.env.REPORTS_DATA_DIR, path.join(ROOT_DIR, 'data')),
  publicDir: resolvePathFromRoot(process.env.REPORTS_PUBLIC_DIR, path.join(ROOT_DIR, 'public')),
  distDir: resolvePathFromRoot(process.env.REPORTS_DIST_DIR, path.join(ROOT_DIR, 'dist')),
  redisUrl: process.env.REDIS_URL || '',
  activepieces: {
    webhookBlogUrl: process.env.ACTIVEPIECES_WEBHOOK_BLOG_URL || '',
    signingSecret: process.env.ACTIVEPIECES_SIGNING_SECRET || '',
    callbackSigningSecret: process.env.ACTIVEPIECES_CALLBACK_SIGNING_SECRET || '',
    timeoutMs: parseNumber(process.env.ACTIVEPIECES_TIMEOUT_MS, 8000),
    retryMax: parseNumber(process.env.ACTIVEPIECES_RETRY_MAX, 3),
    allowedHostnames: parseList(process.env.ACTIVEPIECES_ALLOWED_HOSTNAMES, ['api.activepieces.com']),
  },
  automationRateLimit: {
    windowMs: parseNumber(process.env.AUTOMATION_RATE_LIMIT_WINDOW_MS, 60_000),
    max: parseNumber(process.env.AUTOMATION_RATE_LIMIT_MAX, 20),
  },
  idempotency: {
    ttlMs: parseNumber(process.env.IDEMPOTENCY_TTL_MS, 10 * 60 * 1000),
  },
  queue: {
    driver: process.env.QUEUE_DRIVER || (process.env.REDIS_URL ? 'bullmq' : 'memory'),
    prefix: process.env.QUEUE_PREFIX || 'pai',
  },
}

export default config
