import type { RequestWithContext } from './types.js'

export type ErrorEnvelope = {
  type: string
  title: string
  status: number
  detail?: string
  requestId?: string
  correlationId?: string
  tenantId?: string
  [key: string]: unknown
}

export class HttpError extends Error {
  status: number
  type: string
  detail: string | undefined
  extras: Record<string, unknown> | undefined

  constructor(status: number, title: string, detail?: string, type?: string, extras: Record<string, unknown> = {}) {
    super(title)
    this.status = status
    this.type = type ?? 'about:blank'
    this.detail = detail
    this.extras = extras
  }
}

const getErrorFields = (err: unknown) => {
  const maybe = err as {
    status?: number
    statusCode?: number
    type?: string
    title?: string
    message?: string
    detail?: string
    stack?: string
    extras?: Record<string, unknown>
  }
  return {
    status: maybe.status ?? maybe.statusCode ?? 500,
    type: maybe.type ?? 'about:blank',
    title: maybe.title ?? maybe.message ?? 'Erro inesperado',
    detail: maybe.detail ?? maybe.stack,
    extras: maybe.extras ?? {},
  }
}

export const buildErrorEnvelope = (req: RequestWithContext | undefined, err: unknown): ErrorEnvelope => {
  const { status, type, title, detail, extras } = getErrorFields(err)
  const envelope: ErrorEnvelope = {
    type,
    title,
    status,
  }

  if (detail) envelope.detail = detail
  if (req?.ctx?.requestId) envelope.requestId = req.ctx.requestId
  if (req?.ctx?.correlationId) envelope.correlationId = req.ctx.correlationId
  if (req?.ctx?.tenantId) envelope.tenantId = req.ctx.tenantId

  return { ...envelope, ...(extras || {}) }
}
