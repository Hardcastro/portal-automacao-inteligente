import { EXCERPT_LIMIT } from '../constants'
import { calculateReadTime, generateSlug } from './validateReport'

const sanitizeText = (value) => (typeof value === 'string' ? value.trim() : '')

const clampExcerpt = (text = '') => {
  if (!text) return ''
  const sanitized = sanitizeText(text).replace(/\s+/g, ' ')
  if (sanitized.length <= EXCERPT_LIMIT) return sanitized
  return `${sanitized.slice(0, EXCERPT_LIMIT).trimEnd()}...`
}

const buildExcerpt = (report) => {
  if (report.excerpt) return clampExcerpt(report.excerpt)
  const body = report?.content?.body || ''
  if (body) return clampExcerpt(body)
  if (report.title) return clampExcerpt(report.title)
  return ''
}

const isRecent = (dateString) => {
  const parsed = Date.parse(dateString)
  if (Number.isNaN(parsed)) return false
  const diffDays = (Date.now() - parsed) / (1000 * 60 * 60 * 24)
  return diffDays <= 5
}

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return []
  return tags
    .map((tag) => sanitizeText(tag))
    .filter(Boolean)
    .slice(0, 10)
}

export const normalizeReport = (report) => {
  if (!report || typeof report !== 'object') return null

  const title = sanitizeText(report.title)
  const slug = sanitizeText(report.slug) || generateSlug(title)
  const category = sanitizeText(report.category || '').toLowerCase() || 'tendencias'
  const excerpt = buildExcerpt({ ...report, title })
  const content =
    report.content && typeof report.content === 'object'
      ? {
          type: report.content.type === 'markdown' ? 'markdown' : 'html',
          body: String(report.content.body || ''),
        }
      : null

  const normalized = {
    ...report,
    id: sanitizeText(report.id),
    slug,
    title,
    category,
    excerpt,
    content,
    tags: normalizeTags(report.tags),
    author: sanitizeText(report.author) || 'Motor Inteligente',
    readTime: report.readTime || calculateReadTime(content || { body: excerpt }),
    isNew: isRecent(report.date),
  }

  if (report.contentUrl) {
    normalized.contentUrl = sanitizeText(report.contentUrl)
  }

  return normalized
}

export const normalizeReportsCollection = (reports = [], options = {}) => {
  const { isFallback = false } = options
  if (!Array.isArray(reports)) return []
  return reports
    .map(normalizeReport)
    .filter(Boolean)
    .map((item) => ({ ...item, isFallback }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
