import type { Redis as IORedis } from 'ioredis'
import type { PrismaClientLike } from './prismaClient.js'

export type Scope =
  | 'reports:read'
  | 'reports:write'
  | 'automation:trigger'
  | 'webhooks:callback'
  | string

export interface AuthContext {
  tenantId: string
  apiKeyId: string
  scopes: Scope[]
}

export interface RequestContext {
  requestId: string
  correlationId: string | null
  startTime: bigint
  tenantId?: string
}

export interface RedisLike {
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number>
  set(
    key: string,
    value: string,
    mode: 'NX' | 'XX' | string,
    modifier?: 'EX' | 'PX' | string,
    ttlSeconds?: number,
  ): Promise<string | null>
  ping(): Promise<string>
  quit?(): Promise<void>
  disconnect?(): Promise<void>
  on?(event: string, listener: (...args: unknown[]) => void): void
}

export type RedisClient = IORedis | RedisLike

export interface RequestWithContext {
  ctx: RequestContext
  auth?: AuthContext
  prisma?: PrismaClientLike
  redis?: RedisClient
  params?: Record<string, string>
  query?: Record<string, string>
  body?: unknown
  rawBody?: string
  method?: string
  url?: string
  originalUrl?: string
  baseUrl?: string
  path?: string
  get?: (name: string) => string | undefined
}

export interface ResponseLike {
  statusCode?: number
  locals?: Record<string, unknown>
  headersSent?: boolean
  setHeader: (name: string, value: string | number) => void
  getHeader?: (name: string) => string | number | string[] | undefined
  status: (code: number) => ResponseLike
  json: (payload: unknown) => void
  send: (payload: unknown) => void
  on?: (event: string, listener: (...args: unknown[]) => void) => void
}

export type NextFunction = (err?: unknown) => void
