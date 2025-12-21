import crypto from 'crypto'

const REQUIRED_FIELDS = ['secret', 'timestamp', 'nonce', 'rawBody']

export const validateSigningInput = (input) => {
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = input?.[field]
    return value === undefined || value === null || value === ''
  })

  if (missing.length) {
    throw new Error(`Missing required fields for signature: ${missing.join(', ')}`)
  }
}

export const signActivepiecesPayload = ({ secret, timestamp, nonce, rawBody }) => {
  validateSigningInput({ secret, timestamp, nonce, rawBody })

  const payload = `${timestamp}.${nonce}.${rawBody}`
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  return hmac.digest('hex')
}

export const buildSignedHeaders = ({ secret, rawBody, timestamp = Math.floor(Date.now() / 1000), nonce }) => {
  const finalNonce = nonce || crypto.randomBytes(16).toString('hex')
  const signature = signActivepiecesPayload({ secret, timestamp, nonce: finalNonce, rawBody })

  return {
    'X-Timestamp': String(timestamp),
    'X-Nonce': finalNonce,
    'X-Signature': signature,
  }
}
