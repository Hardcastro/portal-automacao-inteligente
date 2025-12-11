import http from 'http'
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { validateUuid, uuidVersion } from './utils.uuid.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PORT = process.env.PORT || 3000
const REPORTS_SECRET = process.env.REPORTS_SECRET_TOKEN
const REPORTS_FILE = path.join(__dirname, 'public', 'reports.json')
const PAYLOAD_LIMIT = 1_000_000 // ~1MB

const VALID_CATEGORIES = ['geopolitica', 'macroeconomia', 'tendencias', 'mercados']

const ensureReportsFile = async () => {
  await fsPromises.mkdir(path.dirname(REPORTS_FILE), { recursive: true })
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

const writeReportsToDisk = async (reports) => {
  const payload = {
    reports,
    meta: {
      total: reports.length,
      lastUpdated: new Date().toISOString(),
    },
  }
  await fsPromises.writeFile(REPORTS_FILE, JSON.stringify(payload, null, 2))
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
  const sanitizedExcerpt = sanitizeExcerpt(report.excerpt)
  const sanitizedReport = {
    id: report.id,
    slug: report.slug,
    title: String(report.title || '').trim(),
    excerpt: sanitizedExcerpt,
    category: report.category || 'tendencias',
    tags: Array.isArray(report.tags) ? report.tags.filter(Boolean).slice(0, 10) : [],
    date: report.date,
    readTime: report.readTime ? Number(report.readTime) : undefined,
    content: report.content || null,
    contentUrl: report.contentUrl || null,
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

  const invalidMessage = incoming
    .map(validateReportPayload)
    .find((message) => message)

  if (invalidMessage) {
    return sendJson(res, 400, { error: invalidMessage })
  }

  const existing = await readReportsFromDisk()
  const mergedMap = new Map(existing.reports.map((report) => [report.id, normalizeReport(report)]))

  incoming.forEach((report) => {
    mergedMap.set(report.id, { ...mergedMap.get(report.id), ...normalizeReport(report) })
  })

  const mergedReports = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  const payload = await writeReportsToDisk(mergedReports)

  return sendJson(res, 200, {
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
