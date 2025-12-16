export const VALID_CATEGORIES = ['geopolitica', 'macroeconomia', 'tendencias', 'mercados']
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
  }

  const titlePreview = String(report.title || '').slice(0, 250)
  return sanitizeExcerpt(titlePreview)
}

export const validateReport = (report) => {
  if (!report || typeof report !== 'object') return false

  const normalizedSlug = generateSlug(report.slug || report.title || '')
  const normalizedCategory = normalizeCategory(report.category)
  const normalizedExcerpt = sanitizeExcerpt(report.excerpt || extractExcerpt({ ...report, category: normalizedCategory }))

  const requiredFields = ['id', 'title', 'date']
  const missingFields = requiredFields.filter((field) => {
    const value = report[field]
    return value == null || value === ''
  })
  if (missingFields.length > 0) return false

  if (!UUID_REGEX.test(report.id)) return false
  if (!normalizedSlug || !SLUG_REGEX.test(normalizedSlug)) return false
  if (report.title.length < 3 || report.title.length > 240) return false
  if (!normalizedExcerpt) return false

  if (!normalizedCategory) return false

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
  const cleanedExcerpt = sanitizeExcerpt(report.excerpt || extractExcerpt(report))
  const resolvedCategory = normalizeCategory(report.category) || 'tendencias'

  const resolvedSlug = generateSlug(report.slug || report.title || '')

  return {
    ...report,
    slug: resolvedSlug,
    excerpt: cleanedExcerpt,
    category: resolvedCategory,
    tags: normalizeTags(report.tags),
    readTime: report.readTime || calculateReadTime(report.content),
    author: report.author || 'Motor Inteligente',
    isNew: isNewReport(report.date),
  }
}

export const validateAndNormalizeReports = (reports) => {
  if (!Array.isArray(reports)) return []

  return reports
    .map((report) => ({
      ...report,
      slug: generateSlug(report.slug || report.title || ''),
      category: normalizeCategory(report.category) || report.category,
      excerpt: sanitizeExcerpt(report.excerpt || extractExcerpt(report)),
    }))
    .filter(validateReport)
    .map(normalizeReport)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export const buildExcerpt = extractExcerpt
