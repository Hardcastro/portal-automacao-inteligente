import { randomUUID } from 'crypto'

const REQUEST_ID_HEADER = 'x-request-id'
const REQUEST_ID_REGEX = /^[A-Za-z0-9\-_.]{8,}$/

export const requestIdMiddleware = (req, res, next) => {
  const incoming = req.headers[REQUEST_ID_HEADER]
  const requestId = typeof incoming === 'string' && REQUEST_ID_REGEX.test(incoming)
    ? incoming
    : randomUUID()

  req.requestId = requestId
  res.setHeader('X-Request-Id', requestId)
  next()
}
