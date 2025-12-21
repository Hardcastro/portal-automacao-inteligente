import { buildProblem, HttpError } from '../../shared/errors.js'
import { logger } from '../../shared/logger.js'

export const notFoundHandler = (req, res) => {
  const err = new HttpError(404, 'Rota não encontrada', `Path ${req.originalUrl} não existe`)
  const payload = buildProblem({ req, err })
  res.status(404).json(payload)
}

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err)
  const problem = buildProblem({ req, err })
  const status = problem.status || 500

  const logPayload = { err: err?.message || err, stack: err?.stack, requestId: problem.requestId, tenantId: problem.tenantId }
  if (status >= 500) logger.error(logPayload, 'Erro interno')
  else logger.warn(logPayload, 'Erro de requisição')

  res.status(status).json(problem)
}
