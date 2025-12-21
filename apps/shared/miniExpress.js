import http from 'node:http'
import { URL } from 'node:url'

const compilePath = (pattern) => {
  if (pattern === '*' || pattern === '/') return { regex: /^\/?/, keys: [] }
  const keys = []
  const clean = pattern.replace(/\/+$/, '')
  const escape = (value) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const parts = clean.split('/').filter(Boolean)
  const regexParts = parts.map((part) => {
    if (part === '*') return '.*'
    if (part.startsWith(':')) {
      keys.push(part.slice(1))
      return '([^/]+)'
    }
    return escape(part)
  })
  return { regex: new RegExp(`^/${regexParts.join('/')}(?:/)?`), keys }
}

const matchPath = (layer, path) => {
  const { regex, keys } = layer
  const match = regex.exec(path)
  if (!match) return null
  const params = {}
  keys.forEach((key, idx) => {
    params[key] = decodeURIComponent(match[idx + 1])
  })
  const consumed = match[0] || ''
  const restRaw = path.slice(consumed.length)
  const rest = restRaw ? (restRaw.startsWith('/') ? restRaw : `/${restRaw}`) : '/'
  return { params, rest, consumed }
}

const json = (options = {}) => {
  const verify = options.verify
  const limit = options.limit || '1mb'
  const byteLimit = typeof limit === 'string' && limit.endsWith('mb') ? Number(limit.replace('mb', '')) * 1024 * 1024 : 1024 * 1024

  return (req, res, next) => {
    let raw = Buffer.alloc(0)
    req.on('data', (chunk) => {
      raw = Buffer.concat([raw, chunk])
      if (raw.length > byteLimit) {
        res.statusCode = 413
        res.end('Payload too large')
      }
    })
    req.on('end', () => {
      try {
        if (verify) verify(req, res, raw)
        if (raw.length === 0) {
          req.body = {}
          return next()
        }
        req.rawBody = raw.toString('utf8')
        req.body = JSON.parse(req.rawBody)
        next()
      } catch (err) {
        next(err)
      }
    })
  }
}

class Layer {
  constructor(method, path, handlers, isMiddleware = false) {
    this.method = method
    this.path = path
    this.handlers = handlers
    this.isMiddleware = isMiddleware
    const compiled = compilePath(path)
    this.regex = compiled.regex
    this.keys = compiled.keys
  }
}

class Router {
  constructor({ mergeParams = false } = {}) {
    this.stack = []
    this.mergeParams = mergeParams
  }

  use(pathOrHandler, ...handlers) {
    if (typeof pathOrHandler === 'string') {
      this.stack.push(new Layer(null, pathOrHandler, handlers, true))
    } else {
      this.stack.push(new Layer(null, '*', [pathOrHandler, ...handlers], true))
    }
    return this
  }

  get(path, ...handlers) {
    this.stack.push(new Layer('GET', path, handlers))
    return this
  }

  post(path, ...handlers) {
    this.stack.push(new Layer('POST', path, handlers))
    return this
  }

  handle(req, res, out) {
    let idx = 0
    const next = (err) => {
      const path = req.path || '/'
      const layer = this.stack[idx++]
      if (!layer) return out && out(err)

      const match = matchPath(layer, path)
      if (!match) return next(err)

      if (layer.isMiddleware || !layer.method || layer.method === req.method) {
        const prevParams = req.params || {}
        const prevBase = req.baseUrl || ''
        req.params = this.mergeParams ? { ...prevParams, ...match.params } : match.params
        const originalUrl = req.originalUrl
        const originalPath = req.path
        if (layer.isMiddleware && match.rest && match.rest !== '/' && !layer.method) {
          req.path = match.rest
          req.originalUrl = req.originalUrl || req.url
          req.baseUrl = `${prevBase}${match.consumed || ''}`.replace(/\/$/, '')
        } else {
          req.baseUrl = prevBase
        }

        let hIdx = 0
        const runHandler = (error) => {
          const handler = layer.handlers[hIdx++]
          if (!handler) {
            req.params = prevParams
            req.path = originalPath
            req.originalUrl = originalUrl
            req.baseUrl = prevBase
            return next(error)
          }
          try {
            if (error) {
              if (handler.length === 4) {
                return handler(error, req, res, (e) => runHandler(e))
              }
              return runHandler(error)
            }
            const callable = typeof handler === 'object' && typeof handler.handle === 'function' ? handler.handle.bind(handler) : handler
            const result = callable(req, res, (e) => runHandler(e))
            if (result && result.catch) {
              result.catch((e) => runHandler(e))
            }
          } catch (e) {
            runHandler(e)
          }
        }
        return runHandler(err)
      }

      return next(err)
    }

    next()
  }
}

const createApp = () => {
  const app = new Router()

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    req.path = url.pathname
    req.query = Object.fromEntries(url.searchParams.entries())
    req.originalUrl = req.url
    req.params = {}
    req.baseUrl = ''
    req.get = (name) => req.headers[name.toLowerCase()]
    res.locals = {}

    res.status = (code) => {
      res.statusCode = code
      return res
    }
    res.json = (obj) => {
      if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(obj))
    }
    res.send = (data) => {
      if (typeof data === 'object' && !Buffer.isBuffer(data)) {
        if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      } else {
        res.end(data)
      }
    }

    const done = (err) => {
      if (err) {
        res.statusCode = err.status || 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ message: err.message || 'Erro interno', status: res.statusCode }))
      } else if (!res.writableEnded) {
        res.statusCode = 404
        res.end(JSON.stringify({ message: 'Not found' }))
      }
    }

    app.handle(req, res, done)
  })

  app.listen = (port, cb) => server.listen(port, cb)
  app.close = (cb) => server.close(cb)
  app.Router = (opts) => new Router(opts)
  app.json = json

  return app
}

const express = Object.assign(createApp, { Router: (opts) => new Router(opts), json })

export default express
