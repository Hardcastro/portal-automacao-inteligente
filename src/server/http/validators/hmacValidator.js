import crypto from 'crypto'

const REQUIRED_HEADERS = ['x-signature', 'x-timestamp', 'x-nonce']

const isWithinWindow = (timestamp, windowSeconds = 300) => {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const ts = Number.parseInt(timestamp, 10)
  if (Number.isNaN(ts)) return false
  return Math.abs(nowSeconds - ts) <= windowSeconds
}

export const createHmacValidator = ({ secret, windowSeconds = 300 } = {}) => {
  if (!secret) {
    return (req, res, next) => res.status(503).json({ error: 'HMAC não configurado' })
  }

  return (req, res, next) => {
    const missing = REQUIRED_HEADERS.filter((name) => !req.headers[name])
    if (missing.length) {
      return res.status(401).json({ error: `Headers ausentes: ${missing.join(', ')}` })
    }

    const signature = req.headers['x-signature']
    const timestamp = req.headers['x-timestamp']
    const nonce = req.headers['x-nonce']

    if (!isWithinWindow(timestamp, windowSeconds)) {
      return res.status(401).json({ error: 'Timestamp fora da janela permitida' })
    }

    const rawBody = req.rawBody || (req.body instanceof Buffer ? req.body.toString('utf-8') : JSON.stringify(req.body || {}))
    const payload = `${timestamp}.${nonce}.${rawBody}`
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    const expected = hmac.digest('hex')

    if (expected !== signature) {
      return res.status(401).json({ error: 'Assinatura inválida' })
    }

    return next()
  }
}

export const verifyHmac = ({ secret, timestamp, nonce, rawBody, signature, windowSeconds = 300 }) => {
  if (!secret) throw new Error('Secret is required')
  if (!isWithinWindow(timestamp, windowSeconds)) return false
  const payload = `${timestamp}.${nonce}.${rawBody}`
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expected = hmac.digest('hex')
  return expected === signature
}
