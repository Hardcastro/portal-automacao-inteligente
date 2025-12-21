import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateNormalizedReport } from '../src/utils/serverReportUtils.js'

const baseReport = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  slug: 'relatorio-mercados',
  title: 'Relatório de Mercados',
  excerpt: 'Resumo breve',
  category: 'mercados',
  date: '2024-05-01T00:00:00Z',
  content: { type: 'html', body: '<p>Conteúdo</p>' },
}

test('retorna null para relatório normalizado válido', () => {
  const result = validateNormalizedReport(baseReport)
  assert.equal(result, null)
})

test('rejeita conteúdo sem body ou contentUrl', () => {
  const result = validateNormalizedReport({ ...baseReport, content: null, contentUrl: '' })
  assert.ok(result.includes('Envie content ou contentUrl'))
})

test('rejeita categoria inválida', () => {
  const result = validateNormalizedReport({ ...baseReport, category: 'invalida' })
  assert.ok(result.includes('Categoria inválida'))
})
