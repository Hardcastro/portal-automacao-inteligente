import { Redis as IORedis } from 'ioredis'
import { config } from './env.js'
import { createLogger } from './logger.js'
import type { RedisClient } from './types.js'

const logger = createLogger({ module: 'redis' })

type MemoryEntry = { value: string | number; expiresAt?: number }

class MemoryRedis {
  store: Map<string, MemoryEntry>

  constructor() {
    this.store = new Map()
  }

  _isExpired(entry: MemoryEntry) {
    return entry.expiresAt !== undefined && entry.expiresAt < Date.now()
  }

  _getEntry(key: string) {
    const entry = this.store.get(key)
    if (entry && this._isExpired(entry)) {
      this.store.delete(key)
      return null
    }
    return entry || null
  }

  async incr(key: string) {
    const entry = this._getEntry(key)
    const value = entry ? Number(entry.value) + 1 : 1
    const nextEntry: MemoryEntry = entry?.expiresAt ? { value, expiresAt: entry.expiresAt } : { value }
    this.store.set(key, nextEntry)
    return value
  }

  async expire(key: string, seconds: number) {
    const entry = this._getEntry(key)
    if (!entry) return 0
    entry.expiresAt = Date.now() + seconds * 1000
    this.store.set(key, entry)
    return 1
  }

  async set(key: string, value: string, mode: string, modifier?: string, ttlSeconds?: number) {
    if (mode === 'NX') {
      const existing = this._getEntry(key)
      if (existing) return null
    }
    const entry: MemoryEntry = { value }
    if (modifier === 'EX' && ttlSeconds) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000
    }
    this.store.set(key, entry)
    return 'OK'
  }

  async get(key: string) {
    const entry = this._getEntry(key)
    return entry ? String(entry.value) : null
  }

  async ping() {
    return 'PONG'
  }

  async disconnect() {
    this.store.clear()
  }

  reset() {
    this.store.clear()
  }
}

let redisClient: RedisClient | null = null

const createRedisClient = (): RedisClient => {
  if (config.USE_INMEMORY_STUBS) {
    logger.info({}, 'Inicializando Redis em memoria')
    return new MemoryRedis()
  }

  const client = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null })
  client.on('connect', () => logger.info({}, 'Redis conectado'))
  client.on('error', (err: unknown) => logger.error({ err }, 'Falha no Redis'))
  return client
}

export const getRedis = (): RedisClient => {
  if (!redisClient) {
    redisClient = createRedisClient()
  }
  return redisClient
}

export const closeRedis = async (): Promise<void> => {
  if (!redisClient) return
  if ('quit' in redisClient && typeof redisClient.quit === 'function') {
    await redisClient.quit()
  } else if ('disconnect' in redisClient && typeof redisClient.disconnect === 'function') {
    await redisClient.disconnect()
  }
  redisClient = null
}

export const resetRedis = (): void => {
  if (redisClient && 'reset' in redisClient && typeof redisClient.reset === 'function') {
    redisClient.reset()
  }
}
