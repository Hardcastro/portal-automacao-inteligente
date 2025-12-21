import { config } from './env.js'

const log = (level, bindings, message) => {
  const payload = {
    level,
    message,
    ...bindings,
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload))
}

export const logger = {
  info: (bindings, message = '') => log('info', bindings, message),
  warn: (bindings, message = '') => log('warn', bindings, message),
  error: (bindings, message = '') => log('error', bindings, message),
}

export const createLogger = (bindings = {}) => ({
  info: (data, message = '') => logger.info({ ...bindings, ...(data || {}) }, message),
  warn: (data, message = '') => logger.warn({ ...bindings, ...(data || {}) }, message),
  error: (data, message = '') => logger.error({ ...bindings, ...(data || {}) }, message),
})
