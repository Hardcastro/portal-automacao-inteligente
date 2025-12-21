import { config } from '../shared/env.js'
import { createLogger } from '../shared/logger.js'
import { getOutboxDlq } from '../shared/queues.js'

const logger = createLogger({ module: 'outbox' })

const shouldRetry = (status) => status === 429 || status >= 500

const computeNextRetry = (attempts) => {
  const base = Math.min(60000, 1000 * 2 ** attempts)
  const jitter = Math.floor(Math.random() * 500)
  return new Date(Date.now() + base + jitter)
}

export const processOutbox = async (prisma) => {
  const events = await prisma.$transaction(async (tx) => {
    const pending = await tx.outboxEvent.findMany({
      where: {
        status: 'PENDING',
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
      },
      orderBy: { createdAt: 'asc' },
      take: config.OUTBOX_BATCH_SIZE,
    })

    const claimed = []
    for (const ev of pending) {
      const locked = await tx.outboxEvent.updateMany({
        where: { id: ev.id, status: 'PENDING' },
        data: { status: 'PROCESSING', lockedAt: new Date(), attempts: { increment: 1 } },
      })
      if (locked.count) claimed.push(ev)
    }
    return claimed
  })

  if (!events.length) return 0

  const dlq = getOutboxDlq()

  for (const ev of events) {
    const correlationId = `outbox-${ev.id}`
    try {
      if (!config.ACTIVEPIECES_WEBHOOK_BLOG_URL) {
        await prisma.outboxEvent.update({
          where: { id: ev.id },
          data: { status: 'DELIVERED', lastError: 'Webhook não configurado (dry-run)' },
        })
        continue
      }

      const response = await fetch(config.ACTIVEPIECES_WEBHOOK_BLOG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': correlationId,
          'X-Correlation-Id': correlationId,
          'X-Tenant-Id': ev.tenantId,
        },
        body: JSON.stringify(ev.payload),
      })

      if (!response.ok && shouldRetry(response.status)) {
        const nextRetryAt = computeNextRetry(ev.attempts)
        await prisma.outboxEvent.update({
          where: { id: ev.id },
          data: { status: 'PENDING', nextRetryAt, lastError: `HTTP ${response.status}` },
        })
        continue
      }

      if (!response.ok) {
        await prisma.outboxEvent.update({
          where: { id: ev.id },
          data: { status: 'FAILED', lastError: `HTTP ${response.status}` },
        })
        await dlq.add('outbox', { ...ev, error: `HTTP ${response.status}` })
        continue
      }

      await prisma.outboxEvent.update({
        where: { id: ev.id },
        data: { status: 'DELIVERED', lockedAt: null, nextRetryAt: null },
      })
    } catch (err) {
      const attempts = ev.attempts || 1
      if (attempts >= 5) {
        await prisma.outboxEvent.update({
          where: { id: ev.id },
          data: { status: 'DEAD_LETTER', lastError: err.message },
        })
        await dlq.add('outbox', { ...ev, error: err.message })
      } else {
        await prisma.outboxEvent.update({
          where: { id: ev.id },
          data: { status: 'PENDING', nextRetryAt: computeNextRetry(attempts), lastError: err.message },
        })
      }
      logger.error({ err, eventId: ev.id, tenantId: ev.tenantId }, 'Falha ao processar outbox')
    }
  }

  return events.length
}
