export const createRateLimiter = ({ windowMs = 60_000, max = 20 } = {}) => {
  const hits = new Map()

  const prune = (key, now) => {
    const entries = hits.get(key)
    if (!entries) return []
    const filtered = entries.filter((timestamp) => now - timestamp < windowMs)
    hits.set(key, filtered)
    return filtered
  }

  return (req, res, next) => {
    const now = Date.now()
    const key = req.ip || req.connection?.remoteAddress || 'unknown'
    const entries = prune(key, now)

    if (entries.length >= max) {
      return res.status(429).json({ error: 'Muitas requisições, tente novamente mais tarde' })
    }

    entries.push(now)
    hits.set(key, entries)
    return next()
  }
}
