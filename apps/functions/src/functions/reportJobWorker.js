import { app } from '@azure/functions'
import { cosmosClient, blobServiceClient, queueServiceClient } from '../shared/clients.js'
import { config } from '../shared/config.js'
import { mapPostToReport } from '../shared/transform.js'

const slugify = (value = '') =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const buildMarkdown = ({ title, reportDate, topic }) => (
  `# ${title}\n\n` +
  `Data: ${reportDate}\n\n` +
  `Tema: ${topic}\n\n` +
  `Conteudo gerado automaticamente.`
)

const saveMarkdownToBlob = async (blobPath, content) => {
  const container = blobServiceClient.getContainerClient(config.blogContentContainer)
  await container.createIfNotExists()
  const blob = container.getBlockBlobClient(blobPath)
  await blob.upload(content, Buffer.byteLength(content), {
    blobHTTPHeaders: { blobContentType: 'text/markdown' },
  })
}

const loadLatestIndex = async () => {
  const container = blobServiceClient.getContainerClient(config.blogAssetsContainer)
  await container.createIfNotExists()
  const blob = container.getBlobClient('latest.json')
  try {
    const response = await blob.download()
    const text = await response.blobBody?.text()
    if (!text) return []
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
    if (parsed && parsed.latest) return [parsed.latest]
    if (parsed && Array.isArray(parsed.reports)) return parsed.reports
    return []
  } catch {
    return []
  }
}

const saveLatestIndex = async (reports) => {
  const container = blobServiceClient.getContainerClient(config.blogAssetsContainer)
  await container.createIfNotExists()
  const blob = container.getBlockBlobClient('latest.json')
  const payload = JSON.stringify({ reports, meta: { total: reports.length } }, null, 2)
  await blob.upload(payload, Buffer.byteLength(payload), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  })
}

const enqueueDlq = async (payload) => {
  const queue = queueServiceClient.getQueueClient(config.reportsDlq)
  await queue.createIfNotExists()
  await queue.sendMessage(Buffer.from(JSON.stringify(payload)).toString('base64'))
}

app.storageQueue('reportJobWorker', {
  queueName: config.reportsQueue,
  connection: 'AzureWebJobsStorage',
  handler: async (message, context) => {
    let payload
    try {
      payload = typeof message === 'string' ? JSON.parse(message) : message
    } catch (err) {
      context.error('invalid queue payload', err)
      return
    }

    const reportDate = payload.reportDate || new Date().toISOString().slice(0, 10)
    const topic = payload.topic || 'relatorio-diario'
    const version = payload.version || 'v1'
    const idempotencyKey = payload.idempotencyKey || `${reportDate}:${topic}:${version}`
    const runId = payload.jobId || idempotencyKey
    const now = new Date().toISOString()
    const correlationId = payload.correlationId || runId

    const runsContainer = cosmosClient
      .database(config.cosmosDatabase)
      .container(config.cosmosRunsContainer)
    const postsContainer = cosmosClient
      .database(config.cosmosDatabase)
      .container(config.cosmosPostsContainer)

    try {
      const existingRun = await runsContainer.item(runId, config.tenantId).read().catch(() => null)
      if (existingRun?.resource?.status === 'SUCCEEDED') {
        context.log('run already succeeded', { runId, correlationId })
        return
      }

      await runsContainer.items.upsert({
        id: runId,
        tenantId: config.tenantId,
        status: 'RUNNING',
        correlationId,
        jobId: payload.jobId || runId,
        idempotencyKey,
        startedAt: now,
        updatedAt: now,
      })

      const slug = slugify(`${topic}-${reportDate}`)
      const title = payload.title || `Relatorio ${topic} - ${reportDate}`
      const content = buildMarkdown({ title, reportDate, topic })
      const blobPath = `${reportDate.replace(/-/g, '/')}/${slug}.md`

      await saveMarkdownToBlob(blobPath, content)

      const postDoc = {
        id: idempotencyKey,
        tenantId: config.tenantId,
        slug,
        title,
        excerpt: payload.summary || `Relatorio gerado para ${topic} em ${reportDate}.`,
        category: payload.category || 'tendencias',
        tags: payload.tags || [],
        author: payload.author || 'Motor Inteligente',
        readTime: payload.readTime || 4,
        contentBlobPath: blobPath,
        contentType: 'markdown',
        publishedAt: new Date(`${reportDate}T08:00:00Z`).toISOString(),
        createdAt: now,
        updatedAt: now,
        status: 'PUBLISHED',
        idempotencyKey,
      }

      await postsContainer.items.upsert(postDoc)

      const latest = await loadLatestIndex()
      const reportView = mapPostToReport(postDoc)
      const merged = [reportView, ...latest.filter((item) => item.slug !== reportView.slug)]
      await saveLatestIndex(merged.slice(0, config.latestLimit))

      await runsContainer.items.upsert({
        id: runId,
        tenantId: config.tenantId,
        status: 'SUCCEEDED',
        correlationId,
        jobId: payload.jobId || runId,
        idempotencyKey,
        finishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } catch (err) {
      context.error('worker failure', { runId, correlationId, error: err?.message })
      await runsContainer.items.upsert({
        id: runId,
        tenantId: config.tenantId,
        status: 'FAILED',
        correlationId,
        jobId: payload.jobId || runId,
        idempotencyKey,
        finishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        error: err?.message || 'unknown',
      })
      await enqueueDlq({ payload, error: err?.message || 'unknown' })
    }
  },
})
