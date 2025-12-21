import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import config from '../src/server/config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = config.dataDir
const DATA_FILE = path.join(DATA_DIR, 'automation_runs.json')

const STATUS_ORDER = ['queued', 'running', 'succeeded', 'failed']

const now = () => new Date().toISOString()

const isValidStatus = (status) => STATUS_ORDER.includes(status)

const canTransition = (current, next) => {
  if (!isValidStatus(next)) return false
  if (!current) return true
  return STATUS_ORDER.indexOf(next) >= STATUS_ORDER.indexOf(current)
}

const ensureDir = async () => {
  await fsPromises.mkdir(DATA_DIR, { recursive: true })
}

let runs = []

const readJsonFile = async () => {
  if (!fs.existsSync(DATA_FILE)) return null
  try {
    const content = await fsPromises.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.warn('Falha ao ler automation_runs.json', error)
    return null
  }
}

const persist = async () => {
  await fsPromises.writeFile(DATA_FILE, JSON.stringify({ runs }, null, 2))
}

export const initAutomationStore = async () => {
  await ensureDir()
  const existing = await readJsonFile()
  runs = Array.isArray(existing?.runs) ? existing.runs : []
}

export const createAutomationRun = async ({ type, input, idempotencyKey, correlationId, provider = 'activepieces' }) => {
  const createdAt = now()
  const run = {
    id: randomUUID(),
    type,
    status: 'queued',
    createdAt,
    updatedAt: createdAt,
    input: input || null,
    output: null,
    correlationId: correlationId || randomUUID(),
    idempotencyKey: idempotencyKey || null,
    provider,
    providerRunId: null,
  }
  runs = [run, ...runs]
  await persist()
  return run
}

export const findAutomationRunByCorrelation = (correlationId) => runs.find((run) => run.correlationId === correlationId)

export const updateAutomationRunStatus = async (correlationId, nextStatus, { output, providerRunId } = {}) => {
  const run = findAutomationRunByCorrelation(correlationId)
  if (!run) return null
  if (!canTransition(run.status, nextStatus)) return run

  run.status = nextStatus
  run.updatedAt = now()
  if (output !== undefined) run.output = output
  if (providerRunId !== undefined) run.providerRunId = providerRunId

  await persist()
  return run
}

export const getAutomationRuns = () => [...runs]

export const getStatusOrder = () => [...STATUS_ORDER]
