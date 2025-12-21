export class HttpError extends Error {
  constructor(status, title, detail, type = 'about:blank', extras = {}) {
    super(title)
    this.status = status
    this.title = title
    this.detail = detail
    this.type = type
    this.extras = extras
  }
}

export const buildProblem = ({ req, err }) => {
  const status = err.status || err.statusCode || 500
  const title = err.title || err.message || 'Erro inesperado'
  const detail = err.detail || err.stack

  const base = {
    type: err.type || 'about:blank',
    title,
    status,
    detail,
  }

  if (req?.context?.requestId) base.requestId = req.context.requestId
  if (req?.context?.correlationId) base.correlationId = req.context.correlationId
  if (req?.context?.tenantId) base.tenantId = req.context.tenantId

  return { ...base, ...(err.extras || {}) }
}
