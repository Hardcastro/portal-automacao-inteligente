import assert from 'node:assert'
import { test } from 'node:test'
import { generateSlug, normalizeReport, normalizeReportsCollection } from '../src/utils/reportSchema.js'

const sample = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  slug: 'analise-geopolitica-2024',
  title: 'Análise Geopolítica 2024',
  excerpt: 'Resumo curto do relatório',
  category: 'geopolitica',
  date: '2024-05-10T10:00:00Z',
  content: { type: 'html', body: '<p>Conteúdo detalhado</p>' },
}

test('normalizeReport gera slug e valores padrão', () => {
  const normalized = normalizeReport({ ...sample, slug: undefined, author: undefined })
  assert.equal(normalized.slug, generateSlug(sample.title))
  assert.equal(normalized.author, 'Motor Inteligente')
  assert.equal(normalized.category, 'geopolitica')
  assert.ok(normalized.readTime >= 1)
})

test('normalizeReport retorna null para payloads sem título', () => {
  const normalized = normalizeReport({ ...sample, title: '' })
  assert.equal(normalized, null)
})

test('normalizeReportsCollection ordena por data mais recente', () => {
  const older = { ...sample, id: '223e4567-e89b-12d3-a456-426614174000', date: '2024-01-01T00:00:00Z' }
  const newer = { ...sample, id: '323e4567-e89b-12d3-a456-426614174000', date: '2024-06-01T00:00:00Z' }
  const [first] = normalizeReportsCollection([older, newer])
  assert.equal(first.id, newer.id)
})
