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

const config = {
  port: parsePort(process.env.PORT, 3000),
  payloadLimit: process.env.PAYLOAD_LIMIT || '2mb',
  reportsSecret: process.env.REPORTS_SECRET_TOKEN || '',
  enablePublicSnapshot: process.env.ENABLE_REPORTS_SNAPSHOT === 'true',
  dataDir: resolvePathFromRoot(process.env.REPORTS_DATA_DIR, path.join(ROOT_DIR, 'data')),
  publicDir: resolvePathFromRoot(process.env.REPORTS_PUBLIC_DIR, path.join(ROOT_DIR, 'public')),
}

export default config
