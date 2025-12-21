import { createMemoryIdempotencyStore } from './memoryStore.js'
import { createFileIdempotencyStore } from './fileStore.js'

let Redis
try {
  // eslint-disable-next-line global-require
  Redis = (await import('ioredis')).default
} catch {
  Redis = null
}

const DEFAULT_TTL = 10 * 60 * 1000

const createRedisStore = (redisUrl, ttlMs = DEFAULT_TTL) => {
  const client = new Redis(redisUrl, { lazyConnect: true })

  const claim = async (key, ttl = ttlMs) => {
    if (!key) return { ok: true, claimed: true }
    await client.connect()
    const claimed = await client.set(`idemp:${key}:claim`, '1', 'PX', ttl, 'NX')
    if (!claimed) {
      const cached = await client.get(`idemp:${key}:result`)
      return { ok: true, claimed: false, result: cached ? JSON.parse(cached) : undefined }
    }
    return { ok: true, claimed: true }
  }

  const storeResult = async (key, value, ttl = ttlMs) => {
    if (!key) return { ok: true }
    await client.connect()
    await client.set(`idemp:${key}:result`, JSON.stringify(value), 'PX', ttl)
    return { ok: true }
  }

  const getResult = async (key) => {
    if (!key) return null
    await client.connect()
    const cached = await client.get(`idemp:${key}:result`)
    return cached ? JSON.parse(cached) : null
  }

  return { claim, storeResult, getResult }
}

export const createIdempotencyStore = ({ redisUrl, ttlMs = DEFAULT_TTL } = {}) => {
  if (redisUrl && Redis) {
    return createRedisStore(redisUrl, ttlMs)
  }
  if (redisUrl) {
    console.warn('REDIS_URL configurado mas dependência ioredis ausente, usando store em arquivo/memória')
  }
  return createFileIdempotencyStore({ ttlMs }) // persiste em arquivo e memória
}
