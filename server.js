import { createServer } from 'http'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { normalizeIncomingReport, normalizeIncomingReports, sortByDateDesc, validateNormalizedReport } from './src/utils/serverReportUtils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const port = process.env.PORT || 3000
const AUTH_TOKEN = process.env.REPORTS_SECRET_TOKEN

const DATA_DIR = path.join(__dirname, 'data')
const PUBLIC_DIR = path.join(__dirname, 'public')
const STORE_PATH = path.join(DATA_DIR, 'reports.json')
const PUBLIC_REPORTS_PATH = path.join(PUBLIC_DIR, 'reports.json')
const PUBLIC_LATEST_PATH = path.join(PUBLIC_DIR, 'latest.json')
const DIST_DIR = path.join(__dirname, 'dist')

let reportStore = []
let lastUpdated = null

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true })
}

const loadJson = async (filepath) => {
  try {
    const raw = await fs.readFile(filepath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const persistSnapshots = async () => {
  await ensureDir(DATA_DIR)
  await ensureDir(PUBLIC_DIR)

  const meta = { total: reportStore.length, lastUpdated }
  await fs.writeFile(STORE_PATH, JSON.stringify(reportStore, null, 2))
  await fs.writeFile(PUBLIC_REPORTS_PATH, JSON.stringify({ reports: reportStore, meta }, null, 2))

  const latest = reportStore[0]
  if (latest) {
    await fs.writeFile(
      PUBLIC_LATEST_PATH,
      JSON.stringify({ latest, generatedAt: lastUpdated || new Date().toISOString() }, null, 2)
    )
  }
}

const initStore = async () => {
  const existingData = (await loadJson(STORE_PATH)) || (await loadJson(PUBLIC_REPORTS_PATH))
  if (existingData) {
    const reports = Array.isArray(existingData) ? existingData : existingData.reports
    if (Array.isArray(reports)) {
      reportStore = reports.sort(sortByDateDesc)
      lastUpdated = existingData.meta?.lastUpdated || new Date().toISOString()
      return
    }
  }

  reportStore = []
  lastUpdated = null
}
import http from 'http'
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { normalizeIncomingReports } from './src/utils/serverReportUtils.js'
import { findReportBySlug, getReports, initStore, upsertReports } from './data/reportsData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PORT = process.env.PORT || 3000
const REPORTS_SECRET = process.env.REPORTS_SECRET_TOKEN
const PAYLOAD_LIMIT = 1_000_000 // ~1MB

const PUBLIC_DIR = path.join(__dirname, 'public')
const DIST_DIR = path.join(__dirname, 'dist')

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
  const decodedPath = decodeURIComponent(pathname)

  if (decodedPath === '/reports.json' || decodedPath === '/latest.json' || decodedPath.startsWith('/public/')) {
    const relativePath = decodedPath.startsWith('/public/')
      ? decodedPath.replace('/public/', '')
      : decodedPath.replace('/', '')
    const publicPath = path.join(PUBLIC_DIR, relativePath || '')
    const served = await serveStaticFile(res, publicPath)
    if (served) return true
  }

  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath
  const candidate = path.join(DIST_DIR, requestedPath)

  const served = await serveStaticFile(res, candidate)
  if (served) return true

  const indexPath = path.join(DIST_DIR, 'index.html')
  return serveStaticFile(res, indexPath)
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

const parseBody = (req, limit = 1_000_000) =>
  new Promise((resolve, reject) => {
    let size = 0
    const chunks = []

    req
      .on('data', (chunk) => {
        size += chunk.length
        if (size > limit) {
          reject(new Error('Payload too large'))
          req.destroy()
        } else {
          chunks.push(chunk)
        }
      })
      .on('end', () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf-8')
          resolve(raw ? JSON.parse(raw) : {})
        } catch (err) {
          reject(err)
        }
      })
      .on('error', reject)
  })

const serveStaticFile = async (res, filepath) => {
  try {
    const data = await fs.readFile(filepath)
    const ext = path.extname(filepath)
    const mimeMap = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    }
    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' })
    res.end(data)
  } catch {
    res.writeHead(404)
    res.end()
  }
}

const handleGetReports = (req, res, url) => {
  const limitParam = Number.parseInt(url.searchParams.get('limit'), 10)
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 60
  const sorted = [...reportStore].sort(sortByDateDesc)
  const reports = sorted.slice(0, limit)
  sendJson(res, 200, { reports, meta: { total: reportStore.length, lastUpdated, isFallback: false } })
}

const handleGetReportBySlug = (res, slug) => {
  const match = reportStore.find((report) => report.slug === slug)
  if (!match) return sendJson(res, 404, { message: 'Relatório não encontrado' })
  return sendJson(res, 200, match)
}

const handlePostReports = async (req, res) => {
  if (AUTH_TOKEN) {
    const header = req.headers.authorization || ''
    const token = header.replace('Bearer ', '')
    if (token !== AUTH_TOKEN) return sendJson(res, 401, { message: 'Unauthorized' })
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
    body = await parseBody(req)
  } catch (err) {
    return sendJson(res, 400, { message: 'Falha ao ler payload', detail: err.message })
  }

  const incoming = normalizeIncomingReports(body)
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return sendJson(res, 400, { message: 'Payload inválido' })
  }

  const normalized = []
  const errors = []

  incoming.forEach((item, index) => {
    const built = normalizeIncomingReport(item || {})
    const validationError = validateNormalizedReport(built)
    if (validationError) {
      errors.push({ index, id: built.id, error: validationError })
    } else {
      normalized.push(built)
    }
  })

  if (!normalized.length) {
    return sendJson(res, 400, { message: 'Nenhum relatório válido recebido', errors })
  }

  const merged = new Map(reportStore.map((report) => [report.id, report]))
  normalized.forEach((report) => merged.set(report.id, report))

  reportStore = Array.from(merged.values()).sort(sortByDateDesc)
  lastUpdated = new Date().toISOString()
  await persistSnapshots()

  return sendJson(res, 201, {
    message: 'Relatórios processados com sucesso',
    meta: { total: reportStore.length, lastUpdated },
    errors: errors.length ? errors : undefined,
  })
}

const requestListener = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  if (req.method === 'GET' && url.pathname === '/api/reports') {
    return handleGetReports(req, res, url)
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/reports/')) {
    const slug = url.pathname.replace('/api/reports/', '')
    return handleGetReportBySlug(res, slug)
  }

  if (req.method === 'POST' && url.pathname === '/api/reports') {
    return handlePostReports(req, res)
  }

  if (url.pathname.startsWith('/public/')) {
    const filePath = path.join(PUBLIC_DIR, url.pathname.replace('/public/', ''))
    return serveStaticFile(res, filePath)
  }

  const distPath = url.pathname === '/' ? '/index.html' : url.pathname
  const candidate = path.join(DIST_DIR, distPath)
  const indexPath = path.join(DIST_DIR, 'index.html')

  try {
    await fs.access(candidate)
    return serveStaticFile(res, candidate)
  } catch {
    return serveStaticFile(res, indexPath)
  }
}

const start = async () => {
  await initStore()
  createServer(requestListener).listen(port, () => {
    console.log(`Servidor iniciado em http://localhost:${port}`)
  })
}

start()
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

  try {
    const payload = await upsertReports(incoming)
    return sendJson(res, 201, {
      message: 'Relatórios armazenados com sucesso',
      total: payload.meta.total,
      lastUpdated: payload.meta.lastUpdated,
    })
  } catch (error) {
    console.error('Erro ao salvar relatórios', error)
    return sendJson(res, 400, { error: error.message })
  }
}

const handleGetReports = (res, searchParams) => {
  const limit = Math.max(1, Math.min(Number.parseInt(searchParams.get('limit'), 10) || 60, 200))
  const data = getReports(limit)

  return sendJson(res, 200, {
    reports: data.reports,
    meta: {
      total: data.meta.total,
      lastUpdated: data.meta.lastUpdated,
    },
  })
}

const handleGetReportBySlug = (res, slug) => {
  const report = findReportBySlug(slug)
  if (!report) {
    return sendJson(res, 404, { error: 'Relatório não encontrado' })
  }

  return sendJson(res, 200, report)
}

await initStore()

const server = http.createServer(async (req, res) => {
  try {
    const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`)

    if (req.method === 'POST' && pathname === '/api/reports') {
      return handlePostReports(req, res)
    }

    if (req.method === 'GET' && pathname === '/api/reports') {
      return handleGetReports(res, searchParams)
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
