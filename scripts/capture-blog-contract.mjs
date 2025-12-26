import fs from 'node:fs'
import path from 'node:path'

const apiUrl = process.env.REPORTS_API_URL
const fallbackUrl = process.env.REPORTS_FALLBACK_URL
const slugs = (process.env.REPORT_SLUGS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

if (!apiUrl && !fallbackUrl) {
  console.error('Set REPORTS_API_URL and/or REPORTS_FALLBACK_URL')
  process.exit(1)
}

const fixturesDir = path.resolve('tests/fixtures/blog')
fs.mkdirSync(fixturesDir, { recursive: true })

const fetchJson = async (url) => {
  const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } })
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${url}`)
  return res.json()
}

const writeFixture = (name, payload) => {
  const outPath = path.join(fixturesDir, name)
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
  console.log(`Wrote ${outPath}`)
}

if (apiUrl) {
  const listUrl = apiUrl.includes('?') ? `${apiUrl}&limit=60` : `${apiUrl}?limit=60`
  const listPayload = await fetchJson(listUrl)
  writeFixture('list.json', listPayload)

  if (slugs.length > 0) {
    const trimmed = slugs.slice(0, 5)
    for (const [index, slug] of trimmed.entries()) {
      const detailPayload = await fetchJson(`${apiUrl.replace(/\\/$/, '')}/${slug}`)
      if (index === 0) writeFixture('detail.json', detailPayload)
      writeFixture(`detail-${slug}.json`, detailPayload)
    }
  } else {
    console.warn('REPORT_SLUGS not set, skipping detail fixtures')
  }
}

if (fallbackUrl) {
  const fallbackPayload = await fetchJson(fallbackUrl)
  writeFixture('fallback-latest.json', fallbackPayload)
}
