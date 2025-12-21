import assert from 'node:assert/strict'
import { after, before, test, mock } from 'node:test'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'

let server
let baseUrl
let tempDir
let originalFetch

before(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reports-store-automation-'))

  process.env.NODE_ENV = 'test'
  process.env.REPORTS_SECRET_TOKEN = 'super-secret'
  process.env.REPORTS_DATA_DIR = tempDir
  process.env.REPORTS_PUBLIC_DIR = path.join(tempDir, 'public')
  process.env.ENABLE_REPORTS_SNAPSHOT = 'false'
  process.env.ACTIVEPIECES_SIGNING_SECRET = 'ap-secret'
  process.env.ACTIVEPIECES_CALLBACK_SIGNING_SECRET = 'cb-secret'
  process.env.ACTIVEPIECES_WEBHOOK_BLOG_URL = 'https://api.activepieces.com/webhook/test'

  const serverModule = await import('../server.js')
  server = serverModule.default

  await new Promise((resolve) => {
    server.listen(0, () => {
      const { port } = server.address()
      baseUrl = `http://localhost:${port}`
      resolve()
    })
  })
})

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
  mock.restoreAll()
  if (originalFetch) {
    global.fetch = originalFetch
  }
})

test('POST /api/automation/blog retorna 202 e dispara webhook com assinatura', async () => {
  originalFetch = global.fetch
  const responseBody = { received: true }
  const fetchSpy = mock.method(global, 'fetch', async (input, init) => {
    if (typeof input === 'string' && input.startsWith(baseUrl)) {
      return originalFetch(input, init)
    }
    return new Response(JSON.stringify(responseBody), { status: 200 })
  })

  const response = await fetch(`${baseUrl}/api/automation/blog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reports: [{ id: '1' }] }),
  })

  const payload = await response.json()
  assert.equal(response.status, 202)
  assert.equal(payload.ok, true)
  assert.equal(payload.status, 'queued')
  assert.ok(payload.correlationId)

  await new Promise((resolve) => setTimeout(resolve, 30))

  const apCalls = fetchSpy.mock.calls.filter(({ arguments: args }) => {
    const [url] = args
    return typeof url === 'string' && !url.startsWith(baseUrl)
  })
  assert.equal(apCalls.length, 1)
  const [, options] = apCalls[0].arguments
  assert.equal(options.method, 'POST')
  assert.ok(options.headers['X-Signature'])
  assert.ok(options.headers['X-Nonce'])
  assert.ok(options.headers['X-Timestamp'])
})

test('POST /api/automation/blog é idempotente com Idempotency-Key', async () => {
  const idempotencyKey = 'key-123'
  const first = await fetch(`${baseUrl}/api/automation/blog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ reports: [{ id: 'a' }] }),
  })
  const firstPayload = await first.json()

  const second = await fetch(`${baseUrl}/api/automation/blog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ reports: [{ id: 'b' }] }),
  })
  const secondPayload = await second.json()

  assert.equal(first.status, 202)
  assert.equal(second.status, 202)
  assert.equal(firstPayload.correlationId, secondPayload.correlationId)
})

test('POST /api/automation/status exige HMAC e atualiza status', async () => {
  const { correlationId } = await (await fetch(`${baseUrl}/api/automation/blog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reports: [{ id: 'hmac' }] }),
  })).json()

  const unsigned = await fetch(`${baseUrl}/api/automation/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correlationId, status: 'running' }),
  })
  assert.equal(unsigned.status, 401)

  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomBytes(8).toString('hex')
  const rawBody = JSON.stringify({ correlationId, status: 'succeeded', output: { ok: true } })
  const payload = `${timestamp}.${nonce}.${rawBody}`
  const signature = crypto.createHmac('sha256', 'cb-secret').update(payload).digest('hex')

  const signed = await fetch(`${baseUrl}/api/automation/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'X-Timestamp': String(timestamp),
      'X-Nonce': nonce,
    },
    body: rawBody,
  })
  const signedPayload = await signed.json()
  assert.equal(signed.status, 200)
  assert.equal(signedPayload.ok, true)
})
