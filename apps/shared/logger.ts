import { config } from './env.js'

type LogLevel = 'info' | 'warn' | 'error'

type LogBindings = Record<string, unknown>

const log = (level: LogLevel, bindings: LogBindings, message: string) => {
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
  info: (bindings: LogBindings, message = '') => log('info', bindings, message),
  warn: (bindings: LogBindings, message = '') => log('warn', bindings, message),
  error: (bindings: LogBindings, message = '') => log('error', bindings, message),
}

export const createLogger = (bindings: LogBindings = {}) => ({
  info: (data: LogBindings, message = '') => logger.info({ ...bindings, ...(data || {}) }, message),
  warn: (data: LogBindings, message = '') => logger.warn({ ...bindings, ...(data || {}) }, message),
  error: (data: LogBindings, message = '') => logger.error({ ...bindings, ...(data || {}) }, message),
})
