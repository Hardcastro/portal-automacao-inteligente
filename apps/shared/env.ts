type EnvValue = string | number | boolean | undefined | null

const num = (value: EnvValue, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const bool = (value: EnvValue, fallback = false) => {
  if (value === undefined || value === null) return fallback
  return ['true', '1'].includes(String(value).toLowerCase())
}

type EnvMap = Record<string, EnvValue>

type Config = {
  DATABASE_URL: string
  REDIS_URL: string
  API_KEY_PEPPER: string
  ACTIVEPIECES_WEBHOOK_BLOG_URL: string
  ACTIVEPIECES_SIGNING_SECRET: string
  ACTIVEPIECES_CALLBACK_SIGNING_SECRET: string
  ACTIVEPIECES_WEBHOOK_TIMEOUT_MS: number
  PORT: number
  NODE_ENV: string
  IDP_TTL_HOURS: number
  CALLBACK_TIMESTAMP_SKEW_SECONDS: number
  RATE_LIMIT_WINDOW_SECONDS: number
  RATE_LIMIT_REPORTS_READ: number
  RATE_LIMIT_REPORTS_WRITE: number
  RATE_LIMIT_AUTOMATION: number
  RATE_LIMIT_WEBHOOK: number
  AUTOMATION_QUEUE_CONCURRENCY: number
  OUTBOX_BATCH_SIZE: number
  USE_INMEMORY_STUBS: boolean
}

const buildConfig = (overrides: EnvMap = {}): Config => {
  const env = { ...process.env, ...overrides } as EnvMap
  const required = (key: string, fallback = '') => {
    const val = env[key] ?? fallback
    if (val === undefined || val === null || `${val}`.trim() === '') {
      if (fallback) return fallback
      throw new Error(`Variavel obrigatoria ausente: ${key}`)
    }
    return String(val)
  }

  return {
    DATABASE_URL: required('DATABASE_URL', 'memory://db'),
    REDIS_URL: required('REDIS_URL', 'memory://redis'),
    API_KEY_PEPPER: required('API_KEY_PEPPER', 'change-me'),
    ACTIVEPIECES_WEBHOOK_BLOG_URL: String(env.ACTIVEPIECES_WEBHOOK_BLOG_URL ?? ''),
    ACTIVEPIECES_SIGNING_SECRET: String(env.ACTIVEPIECES_SIGNING_SECRET ?? ''),
    ACTIVEPIECES_CALLBACK_SIGNING_SECRET: String(env.ACTIVEPIECES_CALLBACK_SIGNING_SECRET ?? 'change-me'),
    ACTIVEPIECES_WEBHOOK_TIMEOUT_MS: num(env.ACTIVEPIECES_WEBHOOK_TIMEOUT_MS, 5000),
    PORT: num(env.PORT, 3000),
    NODE_ENV: String(env.NODE_ENV ?? 'development'),
    IDP_TTL_HOURS: num(env.IDP_TTL_HOURS, 24),
    CALLBACK_TIMESTAMP_SKEW_SECONDS: num(env.CALLBACK_TIMESTAMP_SKEW_SECONDS, 300),
    RATE_LIMIT_WINDOW_SECONDS: num(env.RATE_LIMIT_WINDOW_SECONDS, 60),
    RATE_LIMIT_REPORTS_READ: num(env.RATE_LIMIT_REPORTS_READ, 120),
    RATE_LIMIT_REPORTS_WRITE: num(env.RATE_LIMIT_REPORTS_WRITE, 30),
    RATE_LIMIT_AUTOMATION: num(env.RATE_LIMIT_AUTOMATION, 30),
    RATE_LIMIT_WEBHOOK: num(env.RATE_LIMIT_WEBHOOK, 60),
    AUTOMATION_QUEUE_CONCURRENCY: num(env.AUTOMATION_QUEUE_CONCURRENCY, 5),
    OUTBOX_BATCH_SIZE: num(env.OUTBOX_BATCH_SIZE, 25),
    USE_INMEMORY_STUBS: bool(env.USE_INMEMORY_STUBS ?? env.USE_REDIS_MOCK, env.NODE_ENV === 'test'),
  }
}

export const loadConfig = (overrides: EnvMap = {}) => buildConfig(overrides)
export const config = buildConfig()
