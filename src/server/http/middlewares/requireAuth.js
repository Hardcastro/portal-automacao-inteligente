import { timingSafeEqual } from 'crypto'

const buildAuthenticator = (secret) => {
  if (!secret) {
    return () => ({ ok: false, status: 503, error: 'Configuração do servidor ausente' })
  }

  const secretBuffer = Buffer.from(secret)

  return (req) => {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : null

    if (!token) {
      return { ok: false, status: 401, error: 'Cabeçalho Authorization ausente' }
    }

    const tokenBuffer = Buffer.from(token)
    if (tokenBuffer.length !== secretBuffer.length) {
      return { ok: false, status: 401, error: 'Não autorizado' }
    }

    const isValid = timingSafeEqual(tokenBuffer, secretBuffer)
    return isValid
      ? { ok: true }
      : { ok: false, status: 401, error: 'Não autorizado' }
  }
}

export const createRequireAuth = (secret) => {
  const authenticateRequest = buildAuthenticator(secret)

  return (req, res, next) => {
    const auth = authenticateRequest(req)
    if (!auth.ok) {
      return res.status(auth.status).json({ error: auth.error })
    }

    return next()
  }
}
