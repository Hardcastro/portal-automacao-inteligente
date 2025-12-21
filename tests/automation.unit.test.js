import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

let tempDir
let automationStore

before(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'automation-runs-'))
  process.env.REPORTS_DATA_DIR = tempDir
  const storeModule = await import('../data/automationRunStore.js')
  await storeModule.initAutomationStore()
  automationStore = storeModule
})

after(async () => {
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
})

test('idempotency store mantém resultado e evita duplicidade', async () => {
  const { createMemoryIdempotencyStore } = await import('../src/infrastructure/idempotency/memoryStore.js')
  const store = createMemoryIdempotencyStore({ ttlMs: 1000 })
  const key = 'abc'

  const first = await store.claim(key)
  assert.equal(first.claimed, true)

  await store.storeResult(key, { value: 1 })

  const cached = await store.getResult(key)
  assert.deepEqual(cached, { value: 1 })

  const second = await store.claim(key)
  assert.equal(second.claimed, false)
  assert.deepEqual(second.result, { value: 1 })
})

test('AutomationRun status é monotônico', async () => {
  const run = await automationStore.createAutomationRun({ type: 'blog', input: { reports: [] } })
  await automationStore.updateAutomationRunStatus(run.correlationId, 'running')
  await automationStore.updateAutomationRunStatus(run.correlationId, 'succeeded')
  const regressed = await automationStore.updateAutomationRunStatus(run.correlationId, 'queued')

  assert.equal(regressed.status, 'succeeded')
})

test('verifyHmac valida assinatura e janela de tempo', async () => {
  const { verifyHmac } = await import('../src/server/http/validators/hmacValidator.js')
  const secret = 'secret'
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = '123'
  const rawBody = '{"a":1}'
  const crypto = await import('node:crypto')
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${nonce}.${rawBody}`).digest('hex')

  assert.equal(verifyHmac({ secret, timestamp, nonce, rawBody, signature }), true)
  assert.equal(verifyHmac({ secret, timestamp: timestamp - 1_000, nonce, rawBody, signature }), false)
})
