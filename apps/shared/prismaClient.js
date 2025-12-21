import { randomUUID } from 'node:crypto'

export const ApiKeyStatus = { ACTIVE: 'ACTIVE', DISABLED: 'DISABLED', REVOKED: 'REVOKED' }
export const OutboxEventStatus = { PENDING: 'PENDING', PROCESSING: 'PROCESSING', DELIVERED: 'DELIVERED', FAILED: 'FAILED', DEAD_LETTER: 'DEAD_LETTER' }
export const AutomationRunStatus = { QUEUED: 'QUEUED', RUNNING: 'RUNNING', SUCCEEDED: 'SUCCEEDED', FAILED: 'FAILED', DEAD_LETTER: 'DEAD_LETTER' }
export const IdempotencyKeyStatus = { PENDING: 'PENDING', COMPLETED: 'COMPLETED', CONFLICT: 'CONFLICT', EXPIRED: 'EXPIRED' }

const clone = (obj) => JSON.parse(JSON.stringify(obj))

class BaseModel {
  constructor(db, collection) {
    this.db = db
    this.collection = collection
  }

  _find(filterFn) {
    return this.db[this.collection].find(filterFn)
  }
}

class TenantModel extends BaseModel {
  constructor(db) {
    super(db, 'tenants')
  }

  async upsert({ where, update, create }) {
    let existing = this._find((t) => t.slug === where.slug)
    if (existing) {
      Object.assign(existing, update, { updatedAt: new Date().toISOString() })
    } else {
      existing = { id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...create }
      this.db.tenants.push(existing)
    }
    return clone(existing)
  }
}

class ApiKeyModel extends BaseModel {
  constructor(db) {
    super(db, 'apiKeys')
  }

  async findFirst({ where }) {
    const key = this._find(
      (k) =>
        (!where.keyHash || k.keyHash === where.keyHash) &&
        (!where.status || k.status === where.status) &&
        (!where.tenantId || k.tenantId === where.tenantId),
    )
    if (!key) return null
    const tenant = this.db.tenants.find((t) => t.id === key.tenantId)
    return clone({ ...key, tenant })
  }

  async upsert({ where, update, create }) {
    let existing = this._find((k) => k.tenantId === where.tenantId_name.tenantId && k.name === where.tenantId_name.name)
    if (existing) {
      Object.assign(existing, update, { updatedAt: new Date().toISOString() })
    } else {
      existing = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...create,
      }
      this.db.apiKeys.push(existing)
    }
    return clone(existing)
  }

  async update({ where, data }) {
    const key = this._find((k) => k.id === where.id)
    if (!key) throw new Error('ApiKey not found')
    Object.assign(key, data, { updatedAt: new Date().toISOString() })
    return clone(key)
  }
}

class ReportModel extends BaseModel {
  constructor(db) {
    super(db, 'reports')
  }

  async upsert({ where, update, create }) {
    let report = this._find((r) => r.tenantId === where.tenantId_slug.tenantId && r.slug === where.tenantId_slug.slug)
    let isNew = false
    if (report) {
      Object.assign(report, update, { updatedAt: new Date().toISOString() })
    } else {
      isNew = true
      report = { id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...create }
      this.db.reports.push(report)
    }
    return clone({ ...report, __isNew: isNew })
  }

  async findMany({ where, orderBy, take, cursor, skip }) {
    let list = this.db.reports.filter((r) => r.tenantId === where.tenantId)
    if (cursor?.id) {
      const idx = list.findIndex((r) => r.id === cursor.id)
      if (idx >= 0 && skip) list = list.slice(idx + skip)
    }
    if (orderBy?.length) {
      list = list.sort((a, b) => {
        for (const entry of orderBy) {
          const [field, direction] = Object.entries(entry)[0]
          const aVal = a[field] || a.createdAt
          const bVal = b[field] || b.createdAt
          if (aVal > bVal) return direction === 'desc' ? -1 : 1
          if (aVal < bVal) return direction === 'desc' ? 1 : -1
        }
        return 0
      })
    }
    if (take) list = list.slice(0, take)
    return clone(list)
  }

  async findFirst({ where, orderBy }) {
    const [first] = await this.findMany({ where, orderBy, take: 1 })
    return first || null
  }
}

class AutomationRunModel extends BaseModel {
  constructor(db) {
    super(db, 'automationRuns')
  }

  async create({ data }) {
    const run = { id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data }
    this.db.automationRuns.push(run)
    return clone(run)
  }

  async findFirst({ where, select }) {
    const run = this._find(
      (r) =>
        (!where.id || r.id === where.id) &&
        (!where.tenantId || r.tenantId === where.tenantId) &&
        (!where.correlationId || r.correlationId === where.correlationId) &&
        (!where.providerRunId || r.providerRunId === where.providerRunId),
    )
    if (!run) return null
    if (select) {
      const result = {}
      Object.keys(select).forEach((key) => {
        if (select[key]) result[key] = run[key]
      })
      return clone(result)
    }
    return clone(run)
  }

  async update({ where, data }) {
    const run = this._find((r) => r.id === where.id)
    if (!run) throw new Error('AutomationRun not found')
    Object.assign(run, data, { updatedAt: new Date().toISOString() })
    return clone(run)
  }
}

class OutboxEventModel extends BaseModel {
  constructor(db) {
    super(db, 'outboxEvents')
  }

  async create({ data }) {
    const event = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attempts: 0,
      ...data,
    }
    this.db.outboxEvents.push(event)
    return clone(event)
  }

  async findMany({ where, orderBy, take }) {
    let list = this.db.outboxEvents.filter(
      (ev) =>
        (!where.status || ev.status === where.status) &&
        (!where.OR ||
          where.OR.some((cond) => {
            if (cond.nextRetryAt === null) return ev.nextRetryAt === null
            if (cond.nextRetryAt?.lte) return !ev.nextRetryAt || new Date(ev.nextRetryAt) <= new Date(cond.nextRetryAt.lte)
            return false
          })),
    )
    if (orderBy) {
      list = list.sort((a, b) => {
        const field = orderBy.createdAt ? 'createdAt' : Object.keys(orderBy)[0]
        return orderBy[field] === 'asc' ? new Date(a[field]) - new Date(b[field]) : new Date(b[field]) - new Date(a[field])
      })
    }
    if (take) list = list.slice(0, take)
    return clone(list)
  }

  async updateMany({ where, data }) {
    let count = 0
    this.db.outboxEvents = this.db.outboxEvents.map((ev) => {
      if (ev.id === where.id && (!where.status || ev.status === where.status)) {
        count += 1
        const increment = typeof data.attempts === 'object' && typeof data.attempts.increment === 'number' ? data.attempts.increment : 0
        const merged = { ...ev, ...data, updatedAt: new Date().toISOString() }
        merged.attempts = (ev.attempts || 0) + increment
        return merged
      }
      return ev
    })
    return { count }
  }

  async update({ where, data }) {
    const event = this._find((ev) => ev.id === where.id)
    if (!event) throw new Error('OutboxEvent not found')
    Object.assign(event, data, { updatedAt: new Date().toISOString() })
    return clone(event)
  }
}

class IdempotencyKeyModel extends BaseModel {
  constructor(db) {
    super(db, 'idempotencyKeys')
  }

  async create({ data }) {
    const exists = this._find(
      (k) => k.tenantId === data.tenantId && k.key === data.key && k.method === data.method && k.path === data.path,
    )
    if (exists) {
      const error = new Error('Unique constraint')
      error.code = 'P2002'
      throw error
    }
    const record = { id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data }
    this.db.idempotencyKeys.push(record)
    return clone(record)
  }

  async findFirst({ where }) {
    const record = this._find(
      (r) =>
        (!where.tenantId || r.tenantId === where.tenantId) &&
        (!where.key || r.key === where.key) &&
        (!where.method || r.method === where.method) &&
        (!where.path || r.path === where.path),
    )
    return record ? clone(record) : null
  }

  async update({ where, data }) {
    const record = this._find((r) => r.id === where.id)
    if (!record) throw new Error('IdempotencyKey not found')
    Object.assign(record, data, { updatedAt: new Date().toISOString() })
    return clone(record)
  }
}

export class PrismaClient {
  constructor() {
    this.tenants = []
    this.apiKeys = []
    this.reports = []
    this.automationRuns = []
    this.outboxEvents = []
    this.idempotencyKeys = []

    this.tenant = new TenantModel(this)
    this.apiKey = new ApiKeyModel(this)
    this.report = new ReportModel(this)
    this.automationRun = new AutomationRunModel(this)
    this.outboxEvent = new OutboxEventModel(this)
    this.idempotencyKey = new IdempotencyKeyModel(this)
  }

  async $transaction(fn) {
    return fn(this)
  }

  async $queryRaw() {
    return 1
  }

  async $disconnect() {
    return true
  }

  reset() {
    this.tenants = []
    this.apiKeys = []
    this.reports = []
    this.automationRuns = []
    this.outboxEvents = []
    this.idempotencyKeys = []
  }
}
