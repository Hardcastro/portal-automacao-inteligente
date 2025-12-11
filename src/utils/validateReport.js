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

  // Campos obrigatórios
  const requiredFields = ['id', 'slug', 'title', 'excerpt', 'category', 'date']
  const missingFields = requiredFields.filter(field => {
    const value = report[field]
    return value == null || value === ''
  })

  if (missingFields.length > 0) {
    console.warn(`Relatório inválido: campos obrigatórios faltando: ${missingFields.join(', ')}`)
    return false
  }

  // Validação de ID (UUID)
  if (!UUID_REGEX.test(report.id)) {
    console.warn(`Relatório inválido: ID não é um UUID válido: ${report.id}`)
    return false
  }

  // Validação de slug
  if (!SLUG_REGEX.test(report.slug)) {
    console.warn(`Relatório inválido: slug inválido: ${report.slug}`)
    return false
  }

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

  // Validação de categoria
  if (!VALID_CATEGORIES.includes(report.category)) {
    console.warn(`Relatório inválido: categoria inválida: ${report.category}`)
    return false
  }

  // Validação de data
  const date = new Date(report.date)
  if (isNaN(date.getTime())) {
    console.warn(`Relatório inválido: data inválida: ${report.date}`)
    return false
  }

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

  // Validação opcional: readTime
  if (report.readTime !== undefined && (typeof report.readTime !== 'number' || report.readTime < 1)) {
    console.warn(`Relatório inválido: readTime deve ser um número positivo`)
    return false
  }

  // Validação opcional: content
  if (report.content) {
    if (!report.content.type || !['html', 'markdown'].includes(report.content.type)) {
      console.warn(`Relatório inválido: content.type deve ser 'html' ou 'markdown'`)
      return false
    }
    if (!report.content.body || typeof report.content.body !== 'string') {
      console.warn(`Relatório inválido: content.body deve ser uma string`)
      return false
    }
  }

  // Validação opcional: contentUrl
  if (report.contentUrl) {
    try {
      new URL(report.contentUrl)
    } catch {
      console.warn(`Relatório inválido: contentUrl não é uma URL válida: ${report.contentUrl}`)
      return false
    }
  }

  return true
}

/**
 * Normaliza um relatório para o formato interno
 * @param {Object} report - Relatório a ser normalizado
 * @returns {Object} - Relatório normalizado
 */
export const normalizeReport = (report) => {
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
    content: report.content,
    contentUrl: report.contentUrl || null,
    thumbnail: report.thumbnail || null,
    author: report.author || 'Motor Inteligente',
    isNew: isNewReport(report.date)
  }
}

/**
 * Gera um slug a partir de um título
 * @param {string} title - Título do relatório
 * @returns {string} - Slug gerado
 */
export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui espaços e caracteres especiais por hífen
    .replace(/^-+|-+$/g, '') // Remove hífens no início e fim
}

/**
 * Calcula o tempo de leitura estimado
 * @param {Object} content - Objeto com type e body
 * @returns {number} - Tempo de leitura em minutos
 */
export const calculateReadTime = (content) => {
  if (!content || !content.body) return 5 // Padrão: 5 minutos

  // Remove tags HTML se for HTML
  const text = content.type === 'html' 
    ? content.body.replace(/<[^>]*>/g, '') 
    : content.body

  // Conta palavras (aproximadamente 200 palavras por minuto)
  const words = text.split(/\s+/).filter(word => word.length > 0).length
  const minutes = Math.ceil(words / 200)

  return Math.max(1, minutes) // Mínimo 1 minuto
}

/**
 * Verifica se um relatório é novo (publicado nos últimos 7 dias)
 * @param {string} dateString - Data do relatório (ISO 8601)
 * @returns {boolean} - true se for novo
 */
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

/**
 * Valida e normaliza um array de relatórios
 * @param {Array} reports - Array de relatórios
 * @returns {Array} - Array de relatórios validados e normalizados
 */
export const validateAndNormalizeReports = (reports) => {
  if (!Array.isArray(reports)) {
    console.warn('Reports deve ser um array')
    return []
  }

  return reports
    .filter(validateReport)
    .map(normalizeReport)
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Ordena por data (mais recente primeiro)
}

