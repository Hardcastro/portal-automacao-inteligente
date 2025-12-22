import { buildErrorEnvelope, HttpError } from '../../shared/httpError.js'
import { logger } from '../../shared/logger.js'
import type { NextFunction, RequestWithContext, ResponseLike } from '../../shared/types.js'

export const notFoundHandler = (req: RequestWithContext, res: ResponseLike) => {
  const err = new HttpError(404, 'Rota nao encontrada', `Path ${req.originalUrl} nao existe`)
  const payload = buildErrorEnvelope(req, err)
  res.status(404).json(payload)
}

export const errorHandler = (err: unknown, req: RequestWithContext, res: ResponseLike, next: NextFunction) => {
  if (res.headersSent) return next(err)
  const problem = buildErrorEnvelope(req, err)
  const status = problem.status || 500

  const logPayload = { err: (err as Error)?.message || err, stack: (err as Error)?.stack, requestId: problem.requestId, tenantId: problem.tenantId }
  if (status >= 500) logger.error(logPayload, 'Erro interno')
  else logger.warn(logPayload, 'Erro de requisicao')

  res.status(status).json(problem)
}
