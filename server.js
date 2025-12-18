import http from 'http'
import path from 'path'
import fs from 'fs'
import fsPromises from 'fs/promises'
import express from 'express'
import { fileURLToPath } from 'url'
import { timingSafeEqual } from 'crypto'
import { normalizeIncomingReports } from './src/utils/serverReportUtils.js'
import { findReportBySlug, getReports, initStore, upsertReports } from './data/reportsData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3000
const REPORTS_SECRET = process.env.REPORTS_SECRET_TOKEN
const PAYLOAD_LIMIT = '2mb'

const PUBLIC_DIR = path.join(__dirname, 'public')
const DIST_DIR = path.join(__dirname, 'dist')

const app = express()

app.use(express.json({ limit: PAYLOAD_LIMIT, type: 'application/json' }))
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'no-referrer',
  })
  next()
})

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

const isPathInside = (targetPath, baseDir) => {
  const resolvedBase = path.resolve(baseDir)
  const resolvedTarget = path.resolve(targetPath)

  return resolvedTarget === resolvedBase || resolvedTarget.startsWith(`${resolvedBase}${path.sep}`)
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

const handleStaticRequest = async (req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    return next()
  }

  const pathname = req.path
  let decodedPath
  try {
    decodedPath = decodeURIComponent(pathname)
  } catch {
    res.status(400).json({ error: 'URL inválida' })
    return
  }

  if (decodedPath === '/reports.json' || decodedPath === '/latest.json' || decodedPath.startsWith('/public/')) {
    const relativePath = decodedPath.startsWith('/public/')
      ? decodedPath.replace('/public/', '')
      : decodedPath.replace('/', '')
    const publicPath = path.join(PUBLIC_DIR, relativePath || '')

    if (!isPathInside(publicPath, PUBLIC_DIR)) {
      res.status(403).json({ error: 'Caminho não permitido' })
      return
    }

    const served = await serveStaticFile(res, publicPath)
    if (served) return
  }

  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath
  const candidate = path.join(DIST_DIR, requestedPath)

  if (!isPathInside(candidate, DIST_DIR)) {
    res.status(403).json({ error: 'Caminho não permitido' })
    return
  }

  const served = await serveStaticFile(res, candidate)
  if (served) return

  const indexPath = path.join(DIST_DIR, 'index.html')
  const servedIndex = await serveStaticFile(res, indexPath)
  if (servedIndex) return

  next()
}

const buildAuthenticator = (secret) => {
  if (!secret) {
    console.warn('REPORTS_SECRET_TOKEN não configurado; requisições protegidas serão rejeitadas.')
    return () => ({ ok: false, status: 503, error: 'Configuração do servidor ausente' })
  }

  const secretBuffer = Buffer.from(secret)

  return (req) => {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : null

    if (!token) {
      return { ok: false, status: 401, error: 'Cabeçalho Authorization ausente' }
    }

    const tokenBuffer = Buffer.from(token)
    if (tokenBuffer.length !== secretBuffer.length) {
      return { ok: false, status: 401, error: 'Não autorizado' }
    }

    const isValid = timingSafeEqual(tokenBuffer, secretBuffer)
    return isValid
      ? { ok: true }
      : { ok: false, status: 401, error: 'Não autorizado' }
  }
}

const authenticateRequest = buildAuthenticator(REPORTS_SECRET)

const requireAuth = (req, res, next) => {
  const auth = authenticateRequest(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error })
  }

  next()
}

const requireJsonContent = (req, res, next) => {
  const contentType = (req.headers['content-type'] || '').toLowerCase()
  if (!contentType.includes('application/json')) {
    return res.status(415).json({ error: 'Content-Type deve ser application/json' })
  }

  next()
}

app.post('/api/reports', requireAuth, requireJsonContent, async (req, res) => {
  const incoming = normalizeIncomingReports(req.body)
  if (incoming.length === 0) {
    return res.status(400).json({ error: 'Payload deve ser um objeto ou array de relatórios' })
  }

  try {
    const payload = await upsertReports(incoming)
    return res.status(201).json({
      message: 'Relatórios armazenados com sucesso',
      total: payload.meta.total,
      lastUpdated: payload.meta.lastUpdated,
    })
  } catch (error) {
    console.error('Erro ao salvar relatórios', error)
    return res.status(400).json({ error: error.message })
  }
})

app.get('/api/reports', (req, res) => {
  const limit = Math.max(1, Math.min(Number.parseInt(req.query.limit, 10) || 60, 200))
  const data = getReports(limit)

  return res.status(200).json({
    reports: data.reports,
    meta: {
      total: data.meta.total,
      lastUpdated: data.meta.lastUpdated,
    },
  })
})

app.get('/api/reports/:slug', (req, res) => {
  const { slug } = req.params
  const report = findReportBySlug(slug)
  if (!report) {
    return res.status(404).json({ error: 'Relatório não encontrado' })
  }

  return res.status(200).json(report)
})

app.use(handleStaticRequest)

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload muito grande' })
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido' })
  }

  console.error('Erro interno no servidor', err)
  return res.status(500).json({ error: 'Erro interno do servidor' })
})

await initStore()

const server = http.createServer(app)

export default server

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Servidor iniciado em http://localhost:${PORT}`)
  })
}
