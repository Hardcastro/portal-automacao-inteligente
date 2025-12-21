import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

let server
let baseUrl
let tempDir
let publicDir

const publishReport = async (report) => {
  const response = await fetch(`${baseUrl}/api/reports`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer super-secret',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(report),
  })

  const payload = await response.json()
  return { response, payload }
}

before(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reports-store-'))
  publicDir = path.join(tempDir, 'public')

  process.env.NODE_ENV = 'test'
  process.env.REPORTS_SECRET_TOKEN = 'super-secret'
  process.env.REPORTS_DATA_DIR = tempDir
  process.env.REPORTS_PUBLIC_DIR = publicDir
  process.env.ENABLE_REPORTS_SNAPSHOT = 'true'

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
  await new Promise((resolve) => server.close(resolve))
  await fs.rm(tempDir, { recursive: true, force: true })
})

test('publicação autenticada persiste relatórios, snapshots e health check', async () => {
  const sample = {
    title: 'Panorama Semanal',
    slug: 'panorama-semanal',
    category: 'tendencias',
    date: '2024-07-01T10:00:00Z',
    content: { type: 'html', body: '<p>Conteúdo detalhado</p>' },
    tags: ['macro'],
  }

  const unauthorized = await fetch(`${baseUrl}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sample),
  })
  assert.equal(unauthorized.status, 401)

  const { response: publishResponse, payload } = await publishReport(sample)
  assert.equal(publishResponse.status, 201)
  assert.ok(payload.total >= 1)
  assert.ok(payload.lastUpdated)

  const listResponse = await fetch(`${baseUrl}/api/reports?limit=5`)
  const listPayload = await listResponse.json()
  assert.equal(listResponse.status, 200)
  assert.ok(listPayload.reports.length >= 1)
  assert.ok(listPayload.reports.some((report) => report.slug === sample.slug))

  const detailResponse = await fetch(`${baseUrl}/api/reports/${sample.slug}`)
  const detail = await detailResponse.json()
  assert.equal(detailResponse.status, 200)
  assert.equal(detail.title, sample.title)
  assert.equal(detail.category, 'tendencias')

  const healthResponse = await fetch(`${baseUrl}/api/health`)
  const health = await healthResponse.json()
  assert.equal(healthResponse.status, 200)
  assert.equal(health.status, 'ok')
  assert.ok(health.meta.total >= 1)
  assert.equal(health.storage.snapshotsEnabled, true)
  assert.equal(health.storage.publicDir, publicDir)

  const latestSnapshot = await fs.readFile(path.join(publicDir, 'latest.json'), 'utf-8')
  const reportsSnapshot = await fs.readFile(path.join(publicDir, 'reports.json'), 'utf-8')
  assert.ok(latestSnapshot.length > 0)
  assert.ok(reportsSnapshot.length > 0)
})
