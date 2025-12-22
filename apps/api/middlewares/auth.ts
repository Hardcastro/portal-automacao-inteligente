import crypto from 'node:crypto'
import { HttpError } from '../../shared/httpError.js'
import { config } from '../../shared/env.js'
import { createLogger } from '../../shared/logger.js'
import type { AuthContext, NextFunction, RequestWithContext, ResponseLike, Scope } from '../../shared/types.js'
import type { PrismaClientLike } from '../../shared/prismaClient.js'

const logger = createLogger({ module: 'auth' })

const hashApiKey = (rawKey: string) => {
  return crypto.createHash('sha256').update(`${config.API_KEY_PEPPER}:${rawKey}`).digest('hex')
}

export const authMiddleware =
  (prisma: PrismaClientLike) => async (req: RequestWithContext, _res: ResponseLike, next: NextFunction) => {
    const header = req.get?.('authorization')
    if (!header) {
      return next(new HttpError(401, 'Missing Authorization header', 'Use Authorization: Bearer <api_key>'))
    }

    const [type, token] = header.split(' ')
    if (type?.toLowerCase() !== 'bearer' || !token) {
      return next(new HttpError(401, 'Formato invalido de Authorization', 'Use Authorization: Bearer <api_key>'))
    }

    const keyHash = hashApiKey(token.trim())
    const apiKey = (await prisma.apiKey.findFirst({
      where: { keyHash, status: 'ACTIVE' },
      include: { tenant: true },
    })) as any

    if (!apiKey) return next(new HttpError(401, 'API key invalida ou desativada'))

    const auth: AuthContext = {
      tenantId: apiKey.tenantId,
      apiKeyId: apiKey.id,
      scopes: apiKey.scopes || [],
    }

    req.auth = auth
    req.ctx.tenantId = auth.tenantId

    setImmediate(() => {
      prisma.apiKey
        .update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        })
        .catch((err: unknown) => logger.warn({ err, apiKeyId: apiKey.id }, 'Falha ao registrar lastUsedAt'))
    })

    return next()
  }

export const enforceTenantScope = () => (req: RequestWithContext, _res: ResponseLike, next: NextFunction) => {
  if (!req.params?.tenantId || !req.auth?.tenantId) {
    return next(new HttpError(400, 'Tenant nao informado'))
  }

  if (req.params.tenantId !== req.auth.tenantId) {
    return next(new HttpError(403, 'Tenant invalido para esta chave', 'Tenant mismatch'))
  }

  req.ctx.tenantId = req.auth.tenantId
  return next()
}

export const requireScope = (scope: Scope) => (req: RequestWithContext, _res: ResponseLike, next: NextFunction) => {
  if (!req.auth?.scopes?.includes(scope)) {
    return next(new HttpError(403, 'Escopo insuficiente', `Requer ${scope}`))
  }
  return next()
}

export const requireAnyScope = (scopes: Scope[]) => (req: RequestWithContext, _res: ResponseLike, next: NextFunction) => {
  if (!Array.isArray(scopes) || scopes.length === 0) return next()
  if (!req.auth?.scopes) return next(new HttpError(403, 'Escopo insuficiente', `Requer um dos escopos: ${scopes.join(', ')}`))

  const has = scopes.some((scope) => req.auth?.scopes?.includes(scope))
  if (!has) return next(new HttpError(403, 'Escopo insuficiente', `Requer um dos escopos: ${scopes.join(', ')}`))
  return next()
}
