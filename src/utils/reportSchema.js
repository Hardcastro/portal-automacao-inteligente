export const VALID_CATEGORIES = ['geopolitica', 'macroeconomia', 'tendencias', 'mercados', 'outros']
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const SLUG_REGEX = /^[a-z0-9-]+$/

export const sanitizeExcerpt = (excerpt = '') => excerpt
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

const normalizeCategory = (category) => {
  if (!category) return null
  const normalized = String(category)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')

  return VALID_CATEGORIES.includes(normalized) ? normalized : null
}

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return []
  return tags
    .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
    .filter(Boolean)
    .slice(0, 10)
}

const normalizeContent = (content) => {
  if (!content || typeof content !== 'object') return null
  const body = typeof content.body === 'string' ? content.body : ''
  if (!body) return null

  return {
    type: content.type === 'markdown' ? 'markdown' : 'html',
    body,
  }
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
  }

  const titlePreview = String(report.title || '').slice(0, 250)
  return sanitizeExcerpt(titlePreview)
}

export const buildExcerpt = extractExcerpt

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

export const normalizeReport = (report = {}, options = {}) => {
  if (!report || typeof report !== 'object') return null

  const content = normalizeContent(report.content)
  const category = normalizeCategory(report.category) || 'tendencias'
  const slug = generateSlug(report.slug || report.title || '')
  const excerpt = extractExcerpt({ ...report, content })

  if (!slug || !report.title || !report.date) return null

  return {
    ...report,
    slug,
    category,
    excerpt,
    tags: normalizeTags(report.tags),
    author: report.author || 'Motor Inteligente',
    readTime: report.readTime || calculateReadTime(content || { body: excerpt }),
    content,
    isNew: isNewReport(report.date),
    isFallback: Boolean(options.isFallback),
  }
}

export const normalizeReportsCollection = (reports = [], options = {}) => {
  if (!Array.isArray(reports)) return []

  return reports
    .map((report) => normalizeReport(report, options))
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}
