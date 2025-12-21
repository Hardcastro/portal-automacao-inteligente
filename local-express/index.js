import { URL } from 'url'
import { createRequire } from 'module'

const defaultJsonType = 'application/json'

const matchPath = (pattern, pathname) => {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = pathname.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params = {}
  for (let i = 0; i < patternParts.length; i += 1) {
    const patternPart = patternParts[i]
    const pathPart = pathParts[i]

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart)
    } else if (patternPart !== pathPart) {
      return null
    }
  }

  return params
}

const runHandler = async (handler, args, next) => {
  try {
    const result = handler(...args)
    if (result && typeof result.then === 'function') {
      await result
    }
  } catch (error) {
    next(error)
  }
}

const express = () => {
  const stack = []
  const composeHandlers = (handlers = []) => (req, res, next) => {
    const chain = handlers.flat().filter(Boolean)
    let idx = 0

    const step = (err) => {
      const handler = chain[idx]
      idx += 1

      if (!handler) return next(err)

      const isErrorHandler = handler.length === 4
      if (err && !isErrorHandler) return step(err)
      if (!err && isErrorHandler) return step()

      const params = isErrorHandler ? [err, req, res, step] : [req, res, step]
      return runHandler(handler, params, step)
    }

    return step()
  }

  const app = (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    req.path = url.pathname
    req.query = Object.fromEntries(url.searchParams.entries())

    res.status = function status(code) {
      this.statusCode = code
      return this
    }

    res.set = function set(field, value) {
      if (typeof field === 'string' && value !== undefined) {
        this.setHeader(field, value)
        return this
      }

      if (field && typeof field === 'object') {
        Object.entries(field).forEach(([key, val]) => {
          this.setHeader(key, val)
        })
        return this
      }

      return this
    }

    res.json = function json(payload) {
      if (!this.getHeader('Content-Type')) {
        this.setHeader('Content-Type', 'application/json')
      }
      this.end(JSON.stringify(payload))
      return this
    }

    let idx = 0

    const next = (err) => {
      const layer = stack[idx]
      idx += 1

      if (!layer) {
        if (err) {
          res.statusCode = res.statusCode || 500
          res.end('Internal Server Error')
        } else if (!res.writableEnded) {
          res.statusCode = res.statusCode || 404
          res.end('Not Found')
        }
        return
      }

      const { type, handler, method, path: layerPath, isError } = layer

      if (type === 'middleware') {
        const pathMatches = !layerPath || req.path.startsWith(layerPath)
        if (!pathMatches) return next(err)

        if (err && !isError) return next(err)
        if (!err && isError) return next()

        if (isError) return runHandler(handler, [err, req, res, next], next)
        return runHandler(handler, [req, res, next], next)
      }

      if (err) return next(err)

      if (method !== req.method) return next()
      const params = matchPath(layerPath, req.path)
      if (!params) return next()

      req.params = params
      return runHandler(handler, [req, res, next], next)
    }

    next()
  }

  app.use = (pathOrHandler, ...maybeHandlers) => {
    const isPathString = typeof pathOrHandler === 'string'
    const handlerList = isPathString ? maybeHandlers : [pathOrHandler, ...maybeHandlers]
    const layerPath = isPathString ? pathOrHandler : null

    handlerList
      .filter(Boolean)
      .forEach((handler) => {
        const isError = typeof handler === 'function' && handler.length === 4
        stack.push({ type: 'middleware', path: layerPath, handler, isError })
      })

    return app
  }

  const registerRoute = (method) => (routePath, ...handlers) => {
    const chain = handlers.length > 0 ? handlers : [(req, res, next) => next()]
    const composed = composeHandlers(chain)
    stack.push({ type: 'route', method, path: routePath, handler: composed })
    return app
  }

  app.get = registerRoute('GET')
  app.post = registerRoute('POST')

  app.listen = (port, cb) => {
    const require = createRequire(import.meta.url)
    const http = require('http')
    const server = http.createServer(app)
    return server.listen(port, cb)
  }

  return app
}

express.json = (options = {}) => {
  const limitBytes = (() => {
    if (!options.limit) return 1 * 1024 * 1024
    if (typeof options.limit === 'number') return options.limit
    if (typeof options.limit === 'string' && options.limit.endsWith('mb')) {
      const numeric = Number.parseInt(options.limit, 10)
      if (!Number.isNaN(numeric)) return numeric * 1024 * 1024
    }
    return 1 * 1024 * 1024
  })()

  const acceptedType = options.type || defaultJsonType

  return (req, res, next) => {
    const contentType = req.headers['content-type'] || ''
    if (!contentType.includes(acceptedType)) return next()

    let size = 0
    const chunks = []

    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limitBytes) {
        req.destroy()
        next({ type: 'entity.too.large' })
        return
      }
      chunks.push(chunk)
    })

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8')
        req.body = raw ? JSON.parse(raw) : {}
        next()
      } catch (error) {
        next(error)
      }
    })

    req.on('error', (error) => next(error))
  }
}

export default express
