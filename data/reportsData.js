import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { normalizeIncomingReport, sortByDateDesc, validateNormalizedReport } from '../src/utils/serverReportUtils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname)
const DATA_FILE = path.join(DATA_DIR, 'reports.json')
const LEGACY_DATA_FILE = path.join(DATA_DIR, 'legacy-reports.json')
const EXAMPLE_FILE = path.join(__dirname, '..', 'src', 'data', 'reports.example.json')
const ENABLE_PUBLIC_SNAPSHOT = process.env.ENABLE_REPORTS_SNAPSHOT === 'true'

const backupCorruptedFile = async (filePath) => {
  if (!fs.existsSync(filePath)) return

  const backupName = `${path.basename(filePath)}.corrupted-${Date.now()}`
  const backupPath = path.join(DATA_DIR, backupName)

  try {
    await fsPromises.copyFile(filePath, backupPath)
  } catch (error) {
    console.error(`Falha ao criar backup de ${filePath}`, error)
  }
}

let reports = []
let meta = { total: 0, lastUpdated: null }

const disambiguateSlug = (baseSlug, date, id, takenSlugs) => {
  const sanitizedId = (id || '').replace(/[^a-z0-9]/gi, '').slice(0, 8)
  const dateSuffix = date ? String(date).slice(0, 10).replace(/[^0-9]/g, '') : ''
  const candidates = [
    dateSuffix ? `${baseSlug}-${dateSuffix}` : null,
    sanitizedId ? `${baseSlug}-${sanitizedId}` : null,
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (!takenSlugs.has(candidate)) return candidate
  }

  let counter = 2
  let candidate = `${baseSlug}-${counter}`
  while (takenSlugs.has(candidate)) {
    counter += 1
    candidate = `${baseSlug}-${counter}`
  }
  return candidate
}

const ensureUniqueSlugs = (incoming, existing) => {
  const slugOwners = new Map(existing.map((report) => [report.slug, report.id]))

  return incoming.map((report) => {
    let finalSlug = report.slug
    const currentOwner = slugOwners.get(finalSlug)

    const hasDifferentOwner = currentOwner && currentOwner !== report.id
    if (hasDifferentOwner) {
      finalSlug = disambiguateSlug(report.slug, report.date, report.id, slugOwners)
    }

    while (slugOwners.has(finalSlug) && slugOwners.get(finalSlug) !== report.id) {
      finalSlug = disambiguateSlug(report.slug, report.date, report.id, slugOwners)
    }

    slugOwners.set(finalSlug, report.id)
    return { ...report, slug: finalSlug }
  })
}

const ensureDirs = async () => {
  await fsPromises.mkdir(DATA_DIR, { recursive: true })
  if (ENABLE_PUBLIC_SNAPSHOT) {
    await fsPromises.mkdir(path.join(__dirname, '..', 'public'), { recursive: true })
  }
}

const readJsonFile = async (filePath) => {
  if (!fs.existsSync(filePath)) return { ok: false, exists: false }
  try {
    const content = await fsPromises.readFile(filePath, 'utf-8')
    return { ok: true, exists: true, data: JSON.parse(content) }
  } catch (error) {
    console.warn(`Não foi possível ler ${filePath}`, error)
    return { ok: false, exists: true, error }
  }
}

const persistSnapshots = async () => {
  const payload = { reports, meta }
  await fsPromises.writeFile(DATA_FILE, JSON.stringify(payload, null, 2))

  if (ENABLE_PUBLIC_SNAPSHOT) {
    const latest = reports[0] || null
    const publicDir = path.join(__dirname, '..', 'public')
    await fsPromises.mkdir(publicDir, { recursive: true })
    await fsPromises.writeFile(path.join(publicDir, 'reports.json'), JSON.stringify(payload, null, 2))
    await fsPromises.writeFile(
      path.join(publicDir, 'latest.json'),
      JSON.stringify({ latest, generatedAt: meta.lastUpdated }, null, 2),
    )
  }
}

export const initStore = async () => {
  await ensureDirs()

  const existing = await readJsonFile(DATA_FILE)
  const legacyData = await readJsonFile(LEGACY_DATA_FILE)
  const bundledExample = await readJsonFile(EXAMPLE_FILE)

  const source = existing.ok
    ? existing.data
    : legacyData.ok
      ? legacyData.data
      : bundledExample.ok
        ? bundledExample.data
        : { reports: [], meta: { total: 0, lastUpdated: null } }

  reports = Array.isArray(source.reports)
    ? ensureUniqueSlugs(source.reports.map(normalizeIncomingReport), [])
    : []
  reports.sort(sortByDateDesc)
  meta = {
    total: reports.length,
    lastUpdated: source.meta?.lastUpdated || null,
  }

  const hasCorruptedPrimary = existing.exists && !existing.ok

  if (hasCorruptedPrimary) {
    await backupCorruptedFile(DATA_FILE)
    console.error('Arquivo de dados corrompido detectado. A escrita foi abortada para evitar perda de dados.')
    return
  }

  await persistSnapshots()
}

export const getReports = (limit) => {
  const sorted = [...reports].sort(sortByDateDesc)
  const sliceLimit = limit ? Math.max(1, Math.min(limit, 200)) : sorted.length
  return {
    reports: sorted.slice(0, sliceLimit),
    meta: { ...meta },
  }
}

export const findReportBySlug = (slug) => reports.find((report) => report.slug === slug)

export const upsertReports = async (incomingReports) => {
  const normalized = ensureUniqueSlugs(incomingReports.map(normalizeIncomingReport), reports)
  const invalid = normalized.map(validateNormalizedReport).find((message) => message)
  if (invalid) {
    throw new Error(invalid)
  }

  const mergedMap = new Map(reports.map((report) => [report.id, report]))
  normalized.forEach((report) => mergedMap.set(report.id, { ...mergedMap.get(report.id), ...report }))

  reports = Array.from(mergedMap.values()).sort(sortByDateDesc)
  meta = {
    total: reports.length,
    lastUpdated: new Date().toISOString(),
  }

  await persistSnapshots()
  return { reports, meta }
}
