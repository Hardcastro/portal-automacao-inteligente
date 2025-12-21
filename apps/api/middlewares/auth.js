import crypto from 'node:crypto'
import { HttpError } from '../../shared/errors.js'
import { config } from '../../shared/env.js'
import { createLogger } from '../../shared/logger.js'

const logger = createLogger({ module: 'auth' })

const hashApiKey = (rawKey) => {
  return crypto.createHash('sha256').update(`${config.API_KEY_PEPPER}:${rawKey}`).digest('hex')
}

export const authMiddleware = (prisma) => async (req, res, next) => {
  const header = req.get('authorization')
  if (!header) {
    return next(new HttpError(401, 'Missing Authorization header', 'Use Authorization: Bearer <api_key>'))
  }

  const [type, token] = header.split(' ')
  if (type?.toLowerCase() !== 'bearer' || !token) {
    return next(new HttpError(401, 'Formato inválido de Authorization', 'Use Authorization: Bearer <api_key>'))
  }

  const keyHash = hashApiKey(token.trim())
  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash, status: 'ACTIVE' },
    include: { tenant: true },
  })

  if (!apiKey) return next(new HttpError(401, 'API key inválida ou desativada'))

  req.auth = {
    tenantId: apiKey.tenantId,
    apiKeyId: apiKey.id,
    scopes: apiKey.scopes || [],
  }
  req.context.tenantId = apiKey.tenantId

  setImmediate(() => {
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => logger.warn({ err, apiKeyId: apiKey.id }, 'Falha ao registrar lastUsedAt'))
  })

  return next()
}

export const enforceTenantScope = () => (req, res, next) => {
  if (!req.params?.tenantId || !req.auth?.tenantId) {
    return next(new HttpError(400, 'Tenant não informado'))
  }

  if (req.params.tenantId !== req.auth.tenantId) {
    return next(new HttpError(403, 'Tenant inválido para esta chave', 'Tenant mismatch'))
  }

  req.context.tenantId = req.auth.tenantId
  return next()
}

export const requireScope = (scope) => (req, res, next) => {
  if (!req.auth?.scopes?.includes(scope)) {
    return next(new HttpError(403, 'Escopo insuficiente', `Requer ${scope}`))
  }
  return next()
}

export const requireAnyScope = (scopes) => (req, res, next) => {
  if (!Array.isArray(scopes) || scopes.length === 0) return next()
  if (!req.auth?.scopes) return next(new HttpError(403, 'Escopo insuficiente', `Requer um dos escopos: ${scopes.join(', ')}`))

  const has = scopes.some((scope) => req.auth.scopes.includes(scope))
  if (!has) return next(new HttpError(403, 'Escopo insuficiente', `Requer um dos escopos: ${scopes.join(', ')}`))
  return next()
}
