import fsPromises from 'fs/promises'
import path from 'path'

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

export const createStaticHandler = ({ publicDir, distDir }) => async (req, res, next) => {
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
    const publicPath = path.join(publicDir, relativePath || '')

    if (!isPathInside(publicPath, publicDir)) {
      res.status(403).json({ error: 'Caminho não permitido' })
      return
    }

    const served = await serveStaticFile(res, publicPath)
    if (served) return
  }

  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath
  const candidate = path.join(distDir, requestedPath)

  if (!isPathInside(candidate, distDir)) {
    res.status(403).json({ error: 'Caminho não permitido' })
    return
  }

  const served = await serveStaticFile(res, candidate)
  if (served) return

  const indexPath = path.join(distDir, 'index.html')
  const servedIndex = await serveStaticFile(res, indexPath)
  if (servedIndex) return

  next()
}
