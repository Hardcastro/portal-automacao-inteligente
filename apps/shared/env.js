const num = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const bool = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback
  return ['true', '1', true].includes(value)
}

const buildConfig = (overrides = {}) => {
  const env = { ...process.env, ...overrides }
  const required = (key, fallback = '') => {
    const val = env[key] ?? fallback
    if (val === undefined || val === null || `${val}`.trim() === '') {
      if (fallback) return fallback
      throw new Error(`Variável obrigatória ausente: ${key}`)
    }
    return val
  }

  return {
    DATABASE_URL: required('DATABASE_URL', 'memory://db'),
    REDIS_URL: required('REDIS_URL', 'memory://redis'),
    API_KEY_PEPPER: required('API_KEY_PEPPER', 'change-me'),
    ACTIVEPIECES_WEBHOOK_BLOG_URL: env.ACTIVEPIECES_WEBHOOK_BLOG_URL || '',
    ACTIVEPIECES_SIGNING_SECRET: env.ACTIVEPIECES_SIGNING_SECRET || '',
    ACTIVEPIECES_CALLBACK_SIGNING_SECRET: env.ACTIVEPIECES_CALLBACK_SIGNING_SECRET || 'change-me',
    ACTIVEPIECES_WEBHOOK_TIMEOUT_MS: num(env.ACTIVEPIECES_WEBHOOK_TIMEOUT_MS, 5000),
    PORT: num(env.PORT, 3000),
    NODE_ENV: env.NODE_ENV || 'development',
    IDP_TTL_HOURS: num(env.IDP_TTL_HOURS, 24),
    CALLBACK_TIMESTAMP_SKEW_SECONDS: num(env.CALLBACK_TIMESTAMP_SKEW_SECONDS, 300),
    RATE_LIMIT_WINDOW_SECONDS: num(env.RATE_LIMIT_WINDOW_SECONDS, 60),
    RATE_LIMIT_REPORTS_READ: num(env.RATE_LIMIT_REPORTS_READ, 120),
    RATE_LIMIT_REPORTS_WRITE: num(env.RATE_LIMIT_REPORTS_WRITE, 30),
    RATE_LIMIT_AUTOMATION: num(env.RATE_LIMIT_AUTOMATION, 30),
    RATE_LIMIT_WEBHOOK: num(env.RATE_LIMIT_WEBHOOK, 60),
    AUTOMATION_QUEUE_CONCURRENCY: num(env.AUTOMATION_QUEUE_CONCURRENCY, 5),
    OUTBOX_BATCH_SIZE: num(env.OUTBOX_BATCH_SIZE, 25),
    USE_REDIS_MOCK: bool(env.USE_REDIS_MOCK, env.NODE_ENV === 'test'),
  }
}

export const loadConfig = (overrides = {}) => buildConfig(overrides)
export const config = buildConfig()
