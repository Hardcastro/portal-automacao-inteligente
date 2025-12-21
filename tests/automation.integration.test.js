import assert from 'node:assert/strict'
import { after, before, test, mock } from 'node:test'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

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
  assert.ok(payload.correlationId)

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
