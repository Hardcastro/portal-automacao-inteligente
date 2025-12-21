import { createLogger } from './logger.js'

const logger = createLogger({ module: 'redis-memory' })

class MemoryRedis {
  constructor() {
    this.store = new Map()
  }

  _isExpired(entry) {
    return entry.expiresAt && entry.expiresAt < Date.now()
  }

  _getEntry(key) {
    const entry = this.store.get(key)
    if (entry && this._isExpired(entry)) {
      this.store.delete(key)
      return null
    }
    return entry
  }

  async incr(key) {
    const entry = this._getEntry(key)
    const value = entry ? Number(entry.value) + 1 : 1
    this.store.set(key, { value, expiresAt: entry?.expiresAt })
    return value
  }

  async expire(key, seconds) {
    const entry = this._getEntry(key)
    if (!entry) return 0
    entry.expiresAt = Date.now() + seconds * 1000
    this.store.set(key, entry)
    return 1
  }

  async set(key, value, mode, modifier, ttlSeconds) {
    if (mode === 'NX') {
      const existing = this._getEntry(key)
      if (existing) return null
    }
    const entry = { value, expiresAt: undefined }
    if (modifier === 'EX' && ttlSeconds) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000
    }
    this.store.set(key, entry)
    return 'OK'
  }

  async get(key) {
    const entry = this._getEntry(key)
    return entry ? entry.value : null
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

let redisClient

export const getRedis = () => {
  if (!redisClient) {
    logger.info({}, 'Inicializando Redis em memória')
    redisClient = new MemoryRedis()
  }
  return redisClient
}

export const resetRedis = () => {
  if (redisClient?.reset) redisClient.reset()
}
