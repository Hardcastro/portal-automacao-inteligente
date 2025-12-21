import assert from 'node:assert'
import { after, before, beforeEach, test } from 'node:test'
import crypto from 'node:crypto'
import app from '../apps/api/app.js'
import { config } from '../apps/shared/env.js'
import { prisma, resetPrisma } from '../apps/shared/prisma.js'
import { resetRedis } from '../apps/shared/redis.js'
import { resetQueues } from '../apps/shared/queues.js'

const hashApiKey = (raw) => crypto.createHash('sha256').update(`${config.API_KEY_PEPPER}:${raw}`).digest('hex')

const seedTenant = async (scopes) => {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'test-tenant' },
    update: { name: 'Test Tenant' },
    create: { slug: 'test-tenant', name: 'Test Tenant' },
  })
  const rawKey = 'test-api-key'
  const keyHash = hashApiKey(rawKey)
  await prisma.apiKey.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: scopes ? 'limited' : 'default-admin' } },
    update: { keyHash, scopes: scopes || ['reports:read', 'reports:write', 'automation:trigger', 'webhooks:callback'], status: 'ACTIVE' },
    create: { tenantId: tenant.id, name: scopes ? 'limited' : 'default-admin', keyHash, scopes: scopes || ['reports:read', 'reports:write', 'automation:trigger', 'webhooks:callback'], status: 'ACTIVE' },
  })
  return { tenant, apiKey: rawKey }
}

let server
let baseUrl

before(async () => {
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(() => {
  server.close()
})

beforeEach(async () => {
  resetPrisma()
  resetRedis()
  resetQueues()
})

test('retorna 401 sem Authorization', async () => {
  const { tenant } = await seedTenant()
  const res = await fetch(`${baseUrl}/v1/tenants/${tenant.id}/reports`)
  assert.equal(res.status, 401)
})

test('retorna 403 em tenant mismatch', async () => {
  const { apiKey } = await seedTenant()
  const res = await fetch(`${baseUrl}/v1/tenants/outro-tenant/reports`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  assert.equal(res.status, 403)
})

test('retorna 403 quando falta escopo', async () => {
  const { apiKey, tenant } = await seedTenant(['reports:read'])
  const res = await fetch(`${baseUrl}/v1/tenants/${tenant.id}/reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'k1',
    },
    body: JSON.stringify({ title: 'A', summary: 'B', content: {}, publishedAt: new Date().toISOString() }),
  })
  assert.equal(res.status, 403)
})

test('idempotência: mesma chave e payload retorna mesma resposta', async () => {
  const { apiKey, tenant } = await seedTenant()
  const payload = { title: 'Relatório', summary: 'Resumo', content: { body: 'x' }, publishedAt: new Date().toISOString() }
  const res1 = await fetch(`${baseUrl}/v1/tenants/${tenant.id}/reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'dup',
    },
    body: JSON.stringify(payload),
  })
  assert.equal(res1.status, 201)
  const body1 = await res1.json()
  assert.equal(body1.created, 1)

  const res2 = await fetch(`${baseUrl}/v1/tenants/${tenant.id}/reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'dup',
    },
    body: JSON.stringify(payload),
  })
  assert.equal(res2.status, 201)
  const body2 = await res2.json()
  assert.deepEqual(body2, body1)

  const reports = await prisma.report.findMany({ where: { tenantId: tenant.id } })
  assert.equal(reports.length, 1)
})

test('idempotência: payload diferente retorna 409', async () => {
  const { apiKey, tenant } = await seedTenant()
  const baseHeaders = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': 'dup2',
  }
  const payload = { title: 'R1', summary: 'S1', content: {}, publishedAt: new Date().toISOString() }
  await fetch(`${baseUrl}/v1/tenants/${tenant.id}/reports`, {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify(payload),
  })
  const res = await fetch(`${baseUrl}/v1/tenants/${tenant.id}/reports`, {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify({ ...payload, summary: 'outro' }),
  })
  assert.equal(res.status, 409)
})

test('POST cria e GET lista relatórios', async () => {
  const { apiKey, tenant } = await seedTenant()
  const payload = { title: 'R', summary: 'S', content: {}, publishedAt: new Date().toISOString() }
  const createRes = await fetch(`${baseUrl}/v1/tenants/${tenant.id}/reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'list-1',
    },
    body: JSON.stringify(payload),
  })
  assert.equal(createRes.status, 201)

  const listRes = await fetch(`${baseUrl}/v1/tenants/${tenant.id}/reports`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  assert.equal(listRes.status, 200)
  const body = await listRes.json()
  assert.ok(Array.isArray(body.reports))
  assert.equal(body.reports.length, 1)
})

test('callback válido atualiza automation run e replay retorna 409', async () => {
  const { apiKey, tenant } = await seedTenant()
  const runRes = await fetch(`${baseUrl}/v1/tenants/${tenant.id}/automation-runs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'auto-1',
    },
    body: JSON.stringify({ input: { foo: 'bar' } }),
  })
  assert.equal(runRes.status, 202)
  const runBody = await runRes.json()

  const rawBody = JSON.stringify({ correlationId: runBody.correlationId, status: 'succeeded', output: { ok: true } })
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = 'nonce-1'
  const signature = crypto.createHmac('sha256', config.ACTIVEPIECES_CALLBACK_SIGNING_SECRET || 'change-me').update(`${timestamp}.${nonce}.${rawBody}`).digest('hex')

  const callbackRes = await fetch(`${baseUrl}/v1/webhooks/activepieces/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
    },
    body: rawBody,
  })
  assert.equal(callbackRes.status, 200)

  const run = await prisma.automationRun.findFirst({ where: { id: runBody.runId } })
  assert.equal(run.status, 'SUCCEEDED')

  const replay = await fetch(`${baseUrl}/v1/webhooks/activepieces/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
    },
    body: rawBody,
  })
  assert.equal(replay.status, 409)
})
