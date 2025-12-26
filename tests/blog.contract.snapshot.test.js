import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const fixturesDir = path.resolve('tests/fixtures/blog')
const apiUrl = process.env.REPORTS_API_URL
const fallbackUrl = process.env.REPORTS_FALLBACK_URL

const loadFixture = (fileName) =>
  JSON.parse(fs.readFileSync(path.join(fixturesDir, fileName), 'utf8'))

const fetchJson = async (url) => {
  const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } })
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${url}`)
  return res.json()
}

test('snapshot: list matches fixture when REPORTS_API_URL is set', async (t) => {
  if (!apiUrl) {
    t.skip('REPORTS_API_URL not set')
    return
  }
  const listUrl = apiUrl.includes('?') ? `${apiUrl}&limit=60` : `${apiUrl}?limit=60`
  const live = await fetchJson(listUrl)
  const fixture = loadFixture('list.json')
  assert.deepEqual(live, fixture)
})

test('snapshot: fallback matches fixture when REPORTS_FALLBACK_URL is set', async (t) => {
  if (!fallbackUrl) {
    t.skip('REPORTS_FALLBACK_URL not set')
    return
  }
  const live = await fetchJson(fallbackUrl)
  const fixture = loadFixture('fallback-latest.json')
  assert.deepEqual(live, fixture)
})
