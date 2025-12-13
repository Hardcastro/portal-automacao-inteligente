export const VALID_CATEGORIES = ['geopolitica', 'macroeconomia', 'tendencias', 'mercados']
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const SLUG_REGEX = /^[a-z0-9-]+$/

export const sanitizeExcerpt = (excerpt = '') => excerpt
/**
 * Validação de relatórios usando Zod
 * 
 * Instalação: npm install zod
 */

// Se usar Zod (recomendado)
// import { z } from 'zod'

// Schema de validação
// const ReportSchema = z.object({
//   id: z.string().uuid(),
//   slug: z.string().regex(/^[a-z0-9-]+$/),
//   title: z.string().min(10).max(200),
//   excerpt: z.string().min(50).max(300),
//   category: z.enum(['geopolitica', 'macroeconomia', 'tendencias', 'mercados']),
//   date: z.string().datetime(),
//   tags: z.array(z.string()).max(10).optional(),
//   readTime: z.number().int().positive().optional(),
//   content: z.object({
//     type: z.enum(['html', 'markdown']),
//     body: z.string()
//   }).optional(),
//   contentUrl: z.string().url().optional(),
//   thumbnail: z.string().url().optional(),
//   author: z.string().optional(),
//   generatedAt: z.string().datetime().optional(),
//   version: z.string().optional()
// })

/**
 * Validação manual (sem dependências externas)
 */
const VALID_CATEGORIES = ['geopolitica', 'macroeconomia', 'tendencias', 'mercados']
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLUG_REGEX = /^[a-z0-9-]+$/

const sanitizeExcerpt = (excerpt = '') => excerpt
  .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
  .replace(/[\u2190-\u21FF]/g, '->')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 250)

export const generateSlug = (title = '') => title
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return []
  return tags
    .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
    .filter(Boolean)
    .slice(0, 10)
}

/**
 * Valida se um relatório tem todos os campos obrigatórios e valores válidos
 * @param {Object} report - Objeto do relatório a ser validado
 * @returns {boolean} - true se válido, false caso contrário
 */
export const validateReport = (report) => {
  if (!report || typeof report !== 'object') {
    console.warn('Relatório inválido: não é um objeto')
    return false
  }

export const calculateReadTime = (content) => {
  if (!content || !content.body) return undefined
  const text = content.type === 'html'
    ? content.body.replace(/<[^>]*>/g, ' ')
    : content.body
  const words = text.split(/\s+/).filter(Boolean).length
  if (!words) return undefined
  return Math.max(1, Math.ceil(words / 200))
}

export const isNewReport = (dateString) => {
  try {
    const reportDate = new Date(dateString)
    const now = new Date()
    const daysDiff = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff <= 7
  } catch {
    return false
  }
}

const extractExcerpt = (report) => {
  if (report.excerpt) return sanitizeExcerpt(report.excerpt)

  const contentBody = report?.content?.body || report?.content || ''
  if (typeof contentBody === 'string' && contentBody.trim().length > 0) {
    const cleanText = contentBody
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (cleanText.length === 0) return ''

    const sentences = cleanText.split(/(?<=[.!?])\s+/)
    const firstSentences = sentences.slice(0, 3).join(' ')
    const excerpt = firstSentences || cleanText.slice(0, 250)
    return sanitizeExcerpt(excerpt)
  // Validação de título
  if (report.title.length < 3 || report.title.length > 240) {
    console.warn(`Relatório inválido: título deve ter entre 3 e 240 caracteres`)
    return false
  }

  // Validação de excerpt
  const cleanedExcerpt = sanitizeExcerpt(report.excerpt)
  if (!cleanedExcerpt) {
    console.warn('Relatório inválido: excerpt vazio ou inválido')
    return false
  }

  const titlePreview = String(report.title || '').slice(0, 250)
  return sanitizeExcerpt(titlePreview)
}

export const validateReport = (report) => {
  if (!report || typeof report !== 'object') return false

  const requiredFields = ['id', 'slug', 'title', 'excerpt', 'category', 'date']
  const missingFields = requiredFields.filter((field) => {
    const value = report[field]
    return value == null || value === ''
  })
  if (missingFields.length > 0) return false
  // Content obrigatorio (content ou contentUrl)
  if (!report.content && !report.contentUrl) {
    console.warn('Relatório inválido: envie content ou contentUrl')
    return false
  }

  // Validação opcional: tags
  if (report.tags && (!Array.isArray(report.tags) || report.tags.length > 10)) {
    console.warn(`Relatório inválido: tags deve ser um array com no máximo 10 itens`)
    return false
  }

  if (!UUID_REGEX.test(report.id)) return false
  if (!SLUG_REGEX.test(report.slug)) return false
  if (report.title.length < 3 || report.title.length > 240) return false
  if (!sanitizeExcerpt(report.excerpt)) return false

  if (!VALID_CATEGORIES.includes(report.category)) return false

  const parsedDate = Date.parse(report.date)
  if (Number.isNaN(parsedDate)) return false

  if (!report.content && !report.contentUrl) return false

  if (report.content) {
    if (!['html', 'markdown'].includes(report.content.type)) return false
    if (typeof report.content.body !== 'string' || report.content.body.length === 0) return false
  }

  if (report.contentUrl) {
    try {
      const url = new URL(report.contentUrl)
      if (!['http:', 'https:'].includes(url.protocol)) return false
    } catch {
      return false
    }
  }

  if (report.tags && (!Array.isArray(report.tags) || report.tags.length > 10)) return false
  if (report.readTime !== undefined && (Number.isNaN(Number(report.readTime)) || Number(report.readTime) < 1)) return false

  return true
}

export const normalizeReport = (report) => {
  const cleanedExcerpt = extractExcerpt(report)
  const resolvedCategory = VALID_CATEGORIES.includes(report.category)
    ? report.category
    : 'tendencias'

  return {
    ...report,
    slug: report.slug || generateSlug(report.title || ''),
    excerpt: cleanedExcerpt,
    category: resolvedCategory,
    tags: normalizeTags(report.tags),
  const cleanedExcerpt = sanitizeExcerpt(report.excerpt)
  return {
    id: report.id,
    slug: report.slug || generateSlug(report.title),
    title: report.title.trim(),
    excerpt: cleanedExcerpt,
    category: VALID_CATEGORIES.includes(report.category) ? report.category : 'tendencias',
    tags: Array.isArray(report.tags) ? report.tags.slice(0, 10) : [],
    date: report.date,
    readTime: report.readTime || calculateReadTime(report.content),
    author: report.author || 'Motor Inteligente',
    isNew: isNewReport(report.date),
  }
}

export const validateAndNormalizeReports = (reports) => {
  if (!Array.isArray(reports)) return []

  return reports
    .filter(validateReport)
    .map(normalizeReport)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export const buildExcerpt = extractExcerpt
