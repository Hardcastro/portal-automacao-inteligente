import http from 'http'
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import { validateUuid, uuidVersion } from './utils.uuid.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PORT = process.env.PORT || 3000
const REPORTS_SECRET = process.env.REPORTS_SECRET_TOKEN
const DATA_DIR = path.join(__dirname, 'data')
const PUBLIC_DIR = path.join(__dirname, 'public')
const DIST_DIR = path.join(__dirname, 'dist')
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json')
const PUBLIC_REPORTS_FILE = path.join(PUBLIC_DIR, 'reports.json')
const PAYLOAD_LIMIT = 1_000_000 // ~1MB

const VALID_CATEGORIES = ['geopolitica', 'macroeconomia', 'tendencias', 'mercados']

// Garante que o arquivo de relatórios existe e move dados legados
const ensureReportsFile = async () => {
  await fsPromises.mkdir(DATA_DIR, { recursive: true })
  await fsPromises.mkdir(PUBLIC_DIR, { recursive: true })

  // Se já existe um reports.json público (legado), use-o como base
  if (!fs.existsSync(REPORTS_FILE) && fs.existsSync(PUBLIC_REPORTS_FILE)) {
    const legacyContent = await fsPromises.readFile(PUBLIC_REPORTS_FILE, 'utf-8')
    await fsPromises.writeFile(REPORTS_FILE, legacyContent)
  }

  if (!fs.existsSync(REPORTS_FILE)) {
    const initialPayload = { reports: [], meta: { total: 0, lastUpdated: null } }
    await fsPromises.writeFile(REPORTS_FILE, JSON.stringify(initialPayload, null, 2))
  }
}

const readReportsFromDisk = async () => {
  await ensureReportsFile()
  const fileContent = await fsPromises.readFile(REPORTS_FILE, 'utf-8')
  try {
    const parsed = JSON.parse(fileContent)
    if (!Array.isArray(parsed.reports)) {
      throw new Error('Estrutura inválida em reports.json')
    }
    return parsed
  } catch (error) {
    console.warn('Falha ao ler reports.json, recriando arquivo.', error)
    const fallback = { reports: [], meta: { total: 0, lastUpdated: null } }
    await fsPromises.writeFile(REPORTS_FILE, JSON.stringify(fallback, null, 2))
    return fallback
  }
}

// Persiste no diretório privado e atualiza o fallback estático público
const writeReportsToDisk = async (reports) => {
  const payload = {
    reports,
    meta: {
      total: reports.length,
      lastUpdated: new Date().toISOString(),
    },
  }

  await fsPromises.writeFile(REPORTS_FILE, JSON.stringify(payload, null, 2))
  await fsPromises.writeFile(PUBLIC_REPORTS_FILE, JSON.stringify(payload, null, 2))

  // Snapshot opcional para publicação estática (ex.: S3)
  const latestReport = payload.reports[0] || null
  await fsPromises.writeFile(
    path.join(PUBLIC_DIR, 'latest.json'),
    JSON.stringify({ latest: latestReport, generatedAt: payload.meta.lastUpdated }, null, 2),
  )

  return payload
}

const isValidDate = (value) => {
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime())
}

const isValidUrl = (value) => {
  if (!value) return false
  try {
    const parsed = new URL(value)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

const sanitizeExcerpt = (excerpt) => {
  if (typeof excerpt !== 'string') return ''
  return excerpt
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/[\u2190-\u21FF]/g, '->')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

const slugify = (value = '') => value
  .toString()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const generateExcerptFromContent = (contentBody = '') => {
  if (typeof contentBody !== 'string' || contentBody.trim().length === 0) {
    return ''
  }

  const cleanText = contentBody
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const sentences = cleanText.split(/(?<=[.!?])\s+/)
  const firstSentences = sentences.slice(0, 3).join(' ')

  const excerpt = firstSentences || cleanText.slice(0, 150)
  return sanitizeExcerpt(excerpt).slice(0, 300)
}

const ensureExcerpt = (report) => {
  if (report.excerpt) return sanitizeExcerpt(report.excerpt)

  const fromContent = generateExcerptFromContent(report?.content?.body || report?.content)
  if (fromContent) return fromContent

  const titleExcerpt = String(report.title || '').slice(0, 150)
  return sanitizeExcerpt(titleExcerpt)
}

const estimateReadTime = (content) => {
  if (!content || typeof content.body !== 'string' || content.body.trim().length === 0) {
    return undefined
  }

  const text = content.type === 'html'
    ? content.body.replace(/<[^>]*>/g, ' ')
    : content.body

  const words = text.split(/\s+/).filter(Boolean).length
  if (words === 0) return undefined

  return Math.max(1, Math.ceil(words / 200))
}

const validateReportPayload = (report) => {
  const requiredFields = ['id', 'title', 'slug', 'excerpt', 'category', 'date']
  const missing = requiredFields.filter((field) => !report?.[field])
  if (missing.length > 0) {
    return `Campos obrigatórios faltando: ${missing.join(', ')}`
  }

  if (!sanitizeExcerpt(report.excerpt)) {
    return 'Excerpt inválido'
  }

  if (!validateUuid(report.id) || uuidVersion(report.id) !== 4) {
    return 'ID inválido: deve ser um UUID v4'
  }

  if (!/^[-a-z0-9]+$/i.test(report.slug)) {
    return 'Slug inválido: use apenas letras, números e hífens'
  }

  if (!isValidDate(report.date)) {
    return 'Data inválida'
  }

  if (!report.content && !report.contentUrl) {
    return 'Envie content ou contentUrl'
  }

  if (report.content) {
    const { type, body } = report.content
    if (!['html', 'markdown'].includes(type) || typeof body !== 'string' || body.length === 0) {
      return 'Content inválido: type deve ser html ou markdown e body deve ser string'
    }
  }

  if (report.contentUrl && !isValidUrl(report.contentUrl)) {
    return 'contentUrl não é uma URL válida'
  }

  if (report.category && !VALID_CATEGORIES.includes(report.category)) {
    return `Categoria inválida. Use: ${VALID_CATEGORIES.join(', ')}`
  }

  if (report.readTime !== undefined && (Number.isNaN(Number(report.readTime)) || Number(report.readTime) <= 0)) {
    return 'readTime deve ser um número positivo'
  }

  return null
}

const normalizeReport = (report) => {
  const fallbackContentUrl = report.contentUrl || report.pdfUrl || report.file || null
  const normalizedSlug = report.slug && /^[-a-z0-9]+$/i.test(report.slug)
    ? report.slug
    : slugify(report.title)

  const sanitizedExcerpt = ensureExcerpt(report)

  const ensuredId = report.id && validateUuid(report.id) && uuidVersion(report.id) === 4
    ? report.id
    : randomUUID()

  const sanitizedReport = {
    id: ensuredId,
    slug: normalizedSlug,
    title: String(report.title || '').trim(),
    excerpt: sanitizedExcerpt,
    category: (report.category || '').toLowerCase() || 'tendencias',
    tags: Array.isArray(report.tags) ? report.tags.filter(Boolean).slice(0, 10) : [],
    date: report.date,
    readTime: report.readTime ? Number(report.readTime) : estimateReadTime(report.content),
    content: report.content || null,
    contentUrl: fallbackContentUrl,
    thumbnail: report.thumbnail || null,
    author: report.author || 'Motor Inteligente',
    metadata: report.metadata || {},
  }

  return sanitizedReport
}

const normalizeIncomingReports = (body) => {
  if (!body) return []

  if (Array.isArray(body)) {
    return body
  }

  if (Array.isArray(body.reports)) {
    return body.reports
  }

  if (typeof body === 'object') {
    return [body]
  }

  return []
}

const parseJsonBody = (req) => new Promise((resolve, reject) => {
  let data = ''
  req.on('data', (chunk) => {
    data += chunk
    if (Buffer.byteLength(data) > PAYLOAD_LIMIT) {
      reject(new Error('PAYLOAD_TOO_LARGE'))
      req.destroy()
    }
  })

  req.on('end', () => {
    if (!data) return resolve(null)
    try {
      const parsed = JSON.parse(data)
      return resolve(parsed)
    } catch (error) {
      return reject(new Error('INVALID_JSON'))
    }
  })
})

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(payload))
}

const authenticateRequest = (req) => {
  if (!REPORTS_SECRET) {
    return { ok: false, status: 500, error: 'REPORTS_SECRET_TOKEN não configurado' }
  }

  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token || token !== REPORTS_SECRET) {
    return { ok: false, status: 401, error: 'Não autorizado' }
  }

  return { ok: true }
}

const handlePostReports = async (req, res) => {
  const auth = authenticateRequest(req)
  if (!auth.ok) {
    return sendJson(res, auth.status, { error: auth.error })
  }

  let body
  try {
    body = await parseJsonBody(req)
  } catch (error) {
    if (error.message === 'PAYLOAD_TOO_LARGE') {
      return sendJson(res, 413, { error: 'Payload muito grande' })
    }
    if (error.message === 'INVALID_JSON') {
      return sendJson(res, 400, { error: 'JSON inválido' })
    }
    return sendJson(res, 500, { error: 'Erro ao ler payload' })
  }

  const incoming = normalizeIncomingReports(body)

  if (incoming.length === 0) {
    return sendJson(res, 400, { error: 'Payload deve ser um objeto ou array de relatórios' })
  }

  const normalized = incoming.map(normalizeReport)

  const invalidMessage = normalized
    .map(validateReportPayload)
    .find((message) => message)

  if (invalidMessage) {
    return sendJson(res, 400, { error: invalidMessage })
  }

  const existing = await readReportsFromDisk()
  const mergedMap = new Map(existing.reports.map((report) => [report.id, normalizeReport(report)]))

  normalized.forEach((report) => {
    mergedMap.set(report.id, { ...mergedMap.get(report.id), ...report })
  })

  const mergedReports = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  const payload = await writeReportsToDisk(mergedReports)

  return sendJson(res, 201, {
    message: 'Relatórios armazenados com sucesso',
    total: payload.meta.total,
    lastUpdated: payload.meta.lastUpdated,
  })
}

const handleGetReports = async (req, res, pathname, searchParams) => {
  const limit = Math.max(1, Math.min(Number.parseInt(searchParams.get('limit'), 10) || 60, 200))
  const data = await readReportsFromDisk()
  const sorted = [...data.reports].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  return sendJson(res, 200, {
    reports: sorted.slice(0, limit),
    meta: {
      total: data.reports.length,
      lastUpdated: data.meta?.lastUpdated || null,
    },
  })
}

const handleGetReportBySlug = async (res, slug) => {
  const data = await readReportsFromDisk()
  const report = data.reports.find((item) => item.slug === slug)

  if (!report) {
    return sendJson(res, 404, { error: 'Relatório não encontrado' })
  }

  return sendJson(res, 200, report)
}

const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  }

  return map[ext] || 'application/octet-stream'
}

const serveStaticFile = async (res, filePath) => {
  try {
    const stat = await fsPromises.stat(filePath)
    if (!stat.isFile()) return false

    const content = await fsPromises.readFile(filePath)
    res.writeHead(200, { 'Content-Type': getContentType(filePath) })
    res.end(content)
    return true
  } catch {
    return false
  }
}

const handleStaticRequest = async (req, res, pathname) => {
  // Serve built assets from dist; fall back to index.html for SPA routing.
  const decodedPath = decodeURIComponent(pathname)
  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath
  const candidate = path.join(DIST_DIR, requestedPath)

  const served = await serveStaticFile(res, candidate)
  if (served) return true

  const indexPath = path.join(DIST_DIR, 'index.html')
  const indexServed = await serveStaticFile(res, indexPath)
  if (indexServed) return true

  return false
}

const server = http.createServer(async (req, res) => {
  try {
    const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`)

    if (req.method === 'POST' && pathname === '/api/reports') {
      return handlePostReports(req, res)
    }

    if (req.method === 'GET' && pathname === '/api/reports') {
      return handleGetReports(req, res, pathname, searchParams)
    }

    if (req.method === 'GET' && pathname.startsWith('/api/reports/')) {
      const slug = pathname.replace('/api/reports/', '')
      return handleGetReportBySlug(res, slug)
    }

    const served = await handleStaticRequest(req, res, pathname)
    if (served) return null

    res.statusCode = 404
    res.end('Not Found')
    return null
  } catch (error) {
    console.error('Erro interno no servidor', error)
    return sendJson(res, 500, { error: 'Erro interno do servidor' })
  }
})

export default server

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Servidor iniciado em http://localhost:${PORT}`)
  })
}
