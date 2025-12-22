import http from 'node:http'
import { URL } from 'node:url'

type Next = (err?: unknown) => void
type Handler = (req: any, res: any, next: Next) => unknown
type ErrorHandler = (err: unknown, req: any, res: any, next: Next) => unknown
type RouterLike = { handle: (req: any, res: any, next: Next) => void }
type HandlerEntry = Handler | ErrorHandler | RouterLike
type VerifyHandler = (req: any, res: any, buf: Buffer) => void

const compilePath = (pattern: string) => {
  if (pattern === '*' || pattern === '/') return { regex: /^\/?/, keys: [] }
  const keys: string[] = []
  const clean = pattern.replace(/\/+$/, '')
  const escape = (value: string) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const parts = clean.split('/').filter(Boolean)
  const regexParts = parts.map((part: string) => {
    if (part === '*') return '.*'
    if (part.startsWith(':')) {
      keys.push(part.slice(1))
      return '([^/]+)'
    }
    return escape(part)
  })
  return { regex: new RegExp(`^/${regexParts.join('/')}(?:/)?`), keys }
}

const matchPath = (layer: Layer, path: string) => {
  const { regex, keys } = layer
  const match = regex.exec(path)
  if (!match) return null
  const params: Record<string, string> = {}
  keys.forEach((key: string, idx: number) => {
    params[key] = decodeURIComponent(match[idx + 1])
  })
  const consumed = match[0] || ''
  const restRaw = path.slice(consumed.length)
  const rest = restRaw ? (restRaw.startsWith('/') ? restRaw : `/${restRaw}`) : '/'
  return { params, rest, consumed }
}

const json = (options: { verify?: VerifyHandler; limit?: string } = {}) => {
  const verify = options.verify
  const limit = options.limit || '1mb'
  const byteLimit = typeof limit === 'string' && limit.endsWith('mb') ? Number(limit.replace('mb', '')) * 1024 * 1024 : 1024 * 1024

  return (req: any, res: any, next: Next) => {
    let raw = Buffer.alloc(0)
    req.on('data', (chunk: Buffer) => {
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
  method: string | null
  path: string
  handlers: HandlerEntry[]
  isMiddleware: boolean
  regex: RegExp
  keys: string[]

  constructor(method: string | null, path: string, handlers: HandlerEntry[], isMiddleware = false) {
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
  stack: Layer[]
  mergeParams: boolean

  constructor({ mergeParams = false }: { mergeParams?: boolean } = {}) {
    this.stack = []
    this.mergeParams = mergeParams
  }

  use(pathOrHandler: string | HandlerEntry, ...handlers: HandlerEntry[]) {
    if (typeof pathOrHandler === 'string') {
      this.stack.push(new Layer(null, pathOrHandler, handlers, true))
    } else {
      this.stack.push(new Layer(null, '*', [pathOrHandler, ...handlers], true))
    }
    return this
  }

  get(path: string, ...handlers: HandlerEntry[]) {
    this.stack.push(new Layer('GET', path, handlers))
    return this
  }

  post(path: string, ...handlers: HandlerEntry[]) {
    this.stack.push(new Layer('POST', path, handlers))
    return this
  }

  handle(req: any, res: any, out?: Next) {
    let idx = 0
    const next = (err?: unknown): void => {
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
        const runHandler = (error?: unknown): void => {
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
              if (typeof handler === 'function' && handler.length === 4) {
                ;(handler as ErrorHandler)(error, req, res, (e: unknown) => runHandler(e))
                return
              }
              runHandler(error)
              return
            }
            const callable =
              typeof handler === 'object' && typeof (handler as RouterLike).handle === 'function'
                ? (handler as RouterLike).handle.bind(handler)
                : (handler as Handler)
            const result = callable(req, res, (e: unknown) => runHandler(e)) as { catch?: (fn: (e: unknown) => void) => void } | void
            if (result && typeof result.catch === 'function') {
              result.catch((e: unknown) => runHandler(e))
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

type App = Router & {
  listen: (port: number, cb?: () => void) => http.Server
  close: (cb?: () => void) => void
  Router: (opts?: { mergeParams?: boolean }) => Router
  json: typeof json
}

const createApp = (): App => {
  const app = new Router() as App

  const server = http.createServer((req, res) => {
    const reqAny = req as any
    const resAny = res as any
    const url = new URL(req.url || '/', 'http://localhost')
    reqAny.path = url.pathname
    reqAny.query = Object.fromEntries(url.searchParams.entries())
    reqAny.originalUrl = req.url
    reqAny.params = {}
    reqAny.baseUrl = ''
    reqAny.get = (name: string) => req.headers[name.toLowerCase()]
    resAny.locals = {}

    resAny.status = (code: number) => {
      res.statusCode = code
      return resAny
    }
    resAny.json = (obj: unknown) => {
      if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(obj))
    }
    resAny.send = (data: unknown) => {
      if (typeof data === 'object' && !Buffer.isBuffer(data)) {
        if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      } else {
        res.end(data)
      }
    }

    const done = (err?: any) => {
      if (err) {
        res.statusCode = err.status || 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ message: err.message || 'Erro interno', status: res.statusCode }))
      } else if (!res.writableEnded) {
        res.statusCode = 404
        res.end(JSON.stringify({ message: 'Not found' }))
      }
    }

    app.handle(reqAny, resAny, done)
  })

  app.listen = (port: number, cb?: () => void) => server.listen(port, cb)
  app.close = (cb?: () => void) => server.close(cb)
  app.Router = (opts: { mergeParams?: boolean } = {}) => new Router(opts)
  app.json = json

  return app
}

const express: typeof createApp & { Router: (opts?: { mergeParams?: boolean }) => Router; json: typeof json } = Object.assign(
  createApp,
  { Router: (opts: { mergeParams?: boolean } = {}) => new Router(opts), json },
)

export default express
