import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { normalizeIncomingReport, sortByDateDesc, validateNormalizedReport } from '../src/utils/serverReportUtils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname)
const PUBLIC_DIR = path.join(__dirname, '..', 'public')
const DIST_DIR = path.join(__dirname, '..', 'dist')
const DATA_FILE = path.join(DATA_DIR, 'reports.json')
const PUBLIC_REPORTS_FILE = path.join(PUBLIC_DIR, 'reports.json')
const LEGACY_PUBLIC_FILE = path.join(PUBLIC_DIR, 'reports.json')

let reports = []
let meta = { total: 0, lastUpdated: null }

const ensureDirs = async () => {
  await fsPromises.mkdir(DATA_DIR, { recursive: true })
  await fsPromises.mkdir(PUBLIC_DIR, { recursive: true })
  await fsPromises.mkdir(DIST_DIR, { recursive: true })
}

const readJsonFile = async (filePath) => {
  if (!fs.existsSync(filePath)) return null
  try {
    const content = await fsPromises.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.warn(`Não foi possível ler ${filePath}`, error)
    return null
  }
}

const persistSnapshots = async () => {
  const payload = { reports, meta }
  await fsPromises.writeFile(DATA_FILE, JSON.stringify(payload, null, 2))
  await fsPromises.writeFile(PUBLIC_REPORTS_FILE, JSON.stringify(payload, null, 2))

  const latest = reports[0] || null
  await fsPromises.writeFile(
    path.join(PUBLIC_DIR, 'latest.json'),
    JSON.stringify({ latest, generatedAt: meta.lastUpdated }, null, 2),
  )
}

export const initStore = async () => {
  await ensureDirs()

  const existing = await readJsonFile(DATA_FILE)
  const legacyPublic = await readJsonFile(LEGACY_PUBLIC_FILE)

  const source = existing || legacyPublic || { reports: [], meta: { total: 0, lastUpdated: null } }

  reports = Array.isArray(source.reports) ? source.reports.map(normalizeIncomingReport) : []
  reports.sort(sortByDateDesc)
  meta = {
    total: reports.length,
    lastUpdated: source.meta?.lastUpdated || null,
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
  const normalized = incomingReports.map(normalizeIncomingReport)
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
