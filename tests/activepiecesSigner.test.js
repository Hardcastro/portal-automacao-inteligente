import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildSignedHeaders, signActivepiecesPayload } from '../src/integrations/activepieces/activepiecesSigner.js'

test('signActivepiecesPayload produz assinatura determinística', () => {
  const secret = 'my-secret'
  const timestamp = 1710000000
  const nonce = 'abc123'
  const rawBody = '{"hello":"world"}'

  const signature = signActivepiecesPayload({ secret, timestamp, nonce, rawBody })
  assert.equal(signature, 'd831d42e67c4e9ad1e7b6b1a07b4e50f0f8edd87ef5024dfbf92e4d74c740ffa')
})

test('buildSignedHeaders inclui timestamp, nonce e assinatura', () => {
  const headers = buildSignedHeaders({
    secret: 'another-secret',
    timestamp: 1710001000,
    nonce: 'nonce-1',
    rawBody: '{}',
  })

  assert.equal(headers['X-Timestamp'], '1710001000')
  assert.equal(headers['X-Nonce'], 'nonce-1')
  assert.ok(headers['X-Signature'])
})
