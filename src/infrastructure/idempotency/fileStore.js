import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '../../server/config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = config.dataDir
const DATA_FILE = path.join(DATA_DIR, 'idempotency.json')

const DEFAULT_TTL = 10 * 60 * 1000

const now = () => Date.now()

const ensureDir = async () => {
  await fsPromises.mkdir(DATA_DIR, { recursive: true })
}

const readJson = async () => {
  if (!fs.existsSync(DATA_FILE)) return { claims: {}, results: {} }
  try {
    const content = await fsPromises.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.warn('Falha ao ler idempotency.json', error)
    return { claims: {}, results: {} }
  }
}

const persist = async (data) => {
  await ensureDir()
  await fsPromises.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}

export const createFileIdempotencyStore = ({ ttlMs = DEFAULT_TTL } = {}) => {
  let cache = { claims: {}, results: {} }

  const refresh = async () => {
    cache = await readJson()
  }

  const isExpired = (entry) => !entry || now() > entry.expiresAt

  const claim = async (key, ttl = ttlMs) => {
    if (!key) return { ok: true, claimed: true }
    await refresh()
    const existingResult = cache.results[key]
    if (existingResult && !isExpired(existingResult)) {
      return { ok: true, claimed: false, result: existingResult.value }
    }
    const existingClaim = cache.claims[key]
    if (existingClaim && !isExpired(existingClaim)) {
      return { ok: true, claimed: false }
    }
    const expiresAt = now() + ttl
    cache.claims[key] = { expiresAt }
    await persist(cache)
    return { ok: true, claimed: true }
  }

  const storeResult = async (key, value, ttl = ttlMs) => {
    if (!key) return { ok: true }
    await refresh()
    const expiresAt = now() + ttl
    cache.results[key] = { value, expiresAt }
    await persist(cache)
    return { ok: true }
  }

  const getResult = async (key) => {
    if (!key) return null
    await refresh()
    const entry = cache.results[key]
    if (!entry || isExpired(entry)) return null
    return entry.value
  }

  return { claim, storeResult, getResult }
}
