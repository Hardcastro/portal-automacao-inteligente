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

const parseBody = (req) => new Promise((resolve, reject) => {
  let size = 0
  const chunks = []

  req
    .on('data', (chunk) => {
      size += chunk.length
      if (size > PAYLOAD_LIMIT) {
        reject(new Error('PAYLOAD_TOO_LARGE'))
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
        reject(new Error('INVALID_JSON'))
      }
    })
    .on('error', reject)
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
    body = await parseBody(req)
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
