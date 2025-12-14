import assert from 'node:assert'
import { test } from 'node:test'
import { validateReport, normalizeReport, validateAndNormalizeReports, generateSlug } from '../src/utils/validateReport.js'

const sample = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  slug: 'analise-geopolitica-2024',
  title: 'Análise Geopolítica 2024',
  excerpt: 'Resumo curto do relatório',
  category: 'geopolitica',
  date: '2024-05-10T10:00:00Z',
  content: { type: 'html', body: '<p>Conteúdo detalhado</p>' },
}

test('validateReport aceita payload válido', () => {
  assert.equal(validateReport(sample), true)
})

test('validateReport rejeita quando falta content e contentUrl', () => {
  const invalid = { ...sample, content: null, contentUrl: null }
  assert.equal(validateReport(invalid), false)
})

test('normalizeReport gera slug quando ausente', () => {
  const normalized = normalizeReport({ ...sample, slug: undefined })
  assert.ok(normalized.slug.startsWith(generateSlug(sample.title)))
})

test('validateAndNormalizeReports ordena por data', () => {
  const older = { ...sample, id: '223e4567-e89b-12d3-a456-426614174000', date: '2024-01-01T00:00:00Z' }
  const newer = { ...sample, id: '323e4567-e89b-12d3-a456-426614174000', date: '2024-06-01T00:00:00Z' }
  const [first] = validateAndNormalizeReports([older, newer])
  assert.equal(first.id, newer.id)
})
