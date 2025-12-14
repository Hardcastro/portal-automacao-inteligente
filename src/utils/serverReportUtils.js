import { randomUUID } from 'crypto'
import { buildExcerpt, calculateReadTime, generateSlug, sanitizeExcerpt, SLUG_REGEX, UUID_REGEX, VALID_CATEGORIES } from './validateReport.js'

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return []
  return tags
    .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
    .filter(Boolean)
    .slice(0, 10)
}

const isValidUrl = (value) => {
  if (!value) return false
  try {
    const parsed = new URL(value)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export const normalizeIncomingReport = (report = {}) => {
  const rawContentUrl = report.contentUrl || report.pdfUrl || report.file || null
  const safeSlug = report.slug && SLUG_REGEX.test(report.slug) ? report.slug : generateSlug(report.title || '')

  const contentBlock = report.content && typeof report.content === 'object'
    ? report.content
    : null

  const normalizedContent = contentBlock
    ? {
      type: contentBlock.type === 'markdown' ? 'markdown' : 'html',
      body: String(contentBlock.body || ''),
    }
    : null

  const excerpt = buildExcerpt({ ...report, content: normalizedContent })
  const ensuredId = report.id && UUID_REGEX.test(report.id) ? report.id : randomUUID()

  return {
    id: ensuredId,
    slug: safeSlug,
    title: String(report.title || '').trim(),
    excerpt,
    category: (report.category || '').toLowerCase() || 'tendencias',
    tags: normalizeTags(report.tags),
    date: report.date,
    readTime: report.readTime ? Number(report.readTime) : calculateReadTime(normalizedContent),
    content: normalizedContent,
    contentUrl: rawContentUrl,
    thumbnail: report.thumbnail || null,
    author: report.author || 'Motor Inteligente',
    metadata: report.metadata || {},
  }
}

export const validateNormalizedReport = (report) => {
  const requiredFields = ['id', 'slug', 'title', 'excerpt', 'category', 'date']
  const missing = requiredFields.filter((field) => !report?.[field])
  if (missing.length) return `Campos obrigatórios faltando: ${missing.join(', ')}`

  if (!UUID_REGEX.test(report.id)) return 'ID inválido (uuid v4)'
  if (!SLUG_REGEX.test(report.slug)) return 'Slug inválido'

  if (!sanitizeExcerpt(report.excerpt)) return 'Excerpt inválido'

  const parsedDate = Date.parse(report.date)
  if (Number.isNaN(parsedDate)) return 'Data inválida'

  if (!report.content && !report.contentUrl) return 'Envie content ou contentUrl'
  if (report.content) {
    if (!['html', 'markdown'].includes(report.content.type)) return 'Content.type deve ser html ou markdown'
    if (typeof report.content.body !== 'string' || report.content.body.length === 0) return 'Content.body deve ser string'
  }
  if (report.contentUrl && !isValidUrl(report.contentUrl)) return 'contentUrl não é uma URL válida'

  if (report.thumbnail && !isValidUrl(report.thumbnail)) return 'thumbnail não é uma URL válida'

  if (report.category && !VALID_CATEGORIES.includes(report.category)) {
    return `Categoria inválida. Use: ${VALID_CATEGORIES.join(', ')}`
  }

  if (report.readTime !== undefined && (Number.isNaN(Number(report.readTime)) || Number(report.readTime) <= 0)) {
    return 'readTime deve ser um número positivo'
  }

  return null
}

export const normalizeIncomingReports = (body) => {
  if (!body) return []

  const source = Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body

  if (Array.isArray(source)) return source
  if (source && Array.isArray(source.reports)) return source.reports
  if (source && typeof source === 'object') return [source]
  if (Array.isArray(body)) return body
  if (Array.isArray(body.reports)) return body.reports
  if (typeof body === 'object') return [body]
  return []
}

export const sortByDateDesc = (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
