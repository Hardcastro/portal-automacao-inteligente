import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { z } from 'zod'

const fixturesDir = path.resolve('tests/fixtures/blog')
const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'invalid date',
})

const reportSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  category: z.enum(['geopolitica', 'macroeconomia', 'tendencias', 'mercados', 'outros']),
  date: isoDate,
  tags: z.array(z.string()).max(10).optional(),
  author: z.string().optional(),
  readTime: z.number().int().positive().optional(),
  content: z
    .object({
      type: z.enum(['html', 'markdown']),
      body: z.string().min(1),
    })
    .optional(),
  contentUrl: z.string().url().nullable().optional(),
  thumbnail: z.string().url().nullable().optional(),
})

const listSchema = z.union([
  z.array(reportSchema),
  z.object({
    reports: z.array(reportSchema),
    meta: z
      .object({
        total: z.number().int().nonnegative(),
        nextCursor: z.string().nullable().optional(),
      })
      .optional(),
  }),
  z.object({
    latest: reportSchema.nullable(),
    meta: z.object({ total: z.number().int().nonnegative() }).optional(),
  }),
])

const detailSchema = reportSchema

const loadFixture = (fileName) =>
  JSON.parse(fs.readFileSync(path.join(fixturesDir, fileName), 'utf8'))

test('blog list fixtures match contract', () => {
  const payload = loadFixture('list.json')
  const parsed = listSchema.safeParse(payload)
  assert.ok(parsed.success, parsed.error?.message)
})

test('blog detail fixtures match contract', () => {
  const payload = loadFixture('detail.json')
  const parsed = detailSchema.safeParse(payload)
  assert.ok(parsed.success, parsed.error?.message)
})

test('blog fallback fixture matches contract', () => {
  const payload = loadFixture('fallback-latest.json')
  const parsed = listSchema.safeParse(payload)
  assert.ok(parsed.success, parsed.error?.message)
})
