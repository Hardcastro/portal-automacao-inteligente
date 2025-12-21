const DEFAULT_TTL = 10 * 60 * 1000

const now = () => Date.now()

export const createMemoryIdempotencyStore = ({ ttlMs = DEFAULT_TTL } = {}) => {
  const claims = new Map()
  const results = new Map()

  const isExpired = (entry) => !entry || now() > entry.expiresAt

  const claim = async (key, ttl = ttlMs) => {
    if (!key) return { ok: true, claimed: true }
    const existingClaim = claims.get(key)
    const existingResult = results.get(key)
    if (existingResult && !isExpired(existingResult)) {
      return { ok: true, claimed: false, result: existingResult.value }
    }

    if (existingClaim && !isExpired(existingClaim)) {
      return { ok: true, claimed: false }
    }

    const expiresAt = now() + ttl
    claims.set(key, { expiresAt })
    return { ok: true, claimed: true }
  }

  const storeResult = async (key, value, ttl = ttlMs) => {
    if (!key) return { ok: true }
    const expiresAt = now() + ttl
    results.set(key, { value, expiresAt })
    return { ok: true }
  }

  const getResult = async (key) => {
    if (!key) return null
    const entry = results.get(key)
    if (!entry) return null
    if (isExpired(entry)) {
      results.delete(key)
      return null
    }
    return entry.value
  }

  return { claim, storeResult, getResult }
}
