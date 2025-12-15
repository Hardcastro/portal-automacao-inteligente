/**
 * Funções auxiliares para formatação e manipulação de relatórios
 */

/**
 * Formata uma data para exibição em português brasileiro
 * @param {string} dateString - Data em formato ISO 8601
 * @returns {string} - Data formatada (ex: "15 de janeiro de 2024")
 */
export const formatDate = (dateString) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  } catch {
    return dateString // Retorna original se houver erro
  }
}

/**
 * Formata uma data para formato curto (ex: "15/01/2024")
 * @param {string} dateString - Data em formato ISO 8601
 * @returns {string} - Data formatada
 */
export const formatDateShort = (dateString) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  } catch {
    return dateString
  }
}

/**
 * Formata uma data relativa (ex: "há 2 dias", "há 1 semana")
 * @param {string} dateString - Data em formato ISO 8601
 * @returns {string} - Data relativa formatada
 */
export const formatDateRelative = (dateString) => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)

    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `há ${diffDays} dias`
    if (diffWeeks === 1) return 'há 1 semana'
    if (diffWeeks < 4) return `há ${diffWeeks} semanas`
    if (diffMonths === 1) return 'há 1 mês'
    if (diffMonths < 12) return `há ${diffMonths} meses`
    
    return formatDate(dateString)
  } catch {
    return dateString
  }
}

/**
 * Obtém o emoji correspondente à categoria
 * @param {string} category - Categoria do relatório
 * @returns {string} - Emoji correspondente
 */
export const getCategoryEmoji = (category) => {
  const emojiMap = {
    geopolitica: '🌍',
    macroeconomia: '📊',
    tendencias: '🚀',
    mercados: '💹'
  }
  return emojiMap[category] || '📄'
}

/**
 * Obtém o nome formatado da categoria
 * @param {string} category - Categoria do relatório
 * @returns {string} - Nome formatado
 */
export const getCategoryName = (category) => {
  const nameMap = {
    geopolitica: 'Geopolítica',
    macroeconomia: 'Macroeconomia',
    tendencias: 'Tendências',
    mercados: 'Mercados'
  }
  return nameMap[category] || category
}

/**
 * Filtra relatórios por categoria
 * @param {Array} reports - Array de relatórios
 * @param {string} category - Categoria para filtrar ('todos' retorna todos)
 * @returns {Array} - Relatórios filtrados
 */
export const filterByCategory = (reports, category) => {
  if (category === 'todos') return reports
  return reports.filter(report => report.category === category)
}

/**
 * Busca relatórios por texto
 * @param {Array} reports - Array de relatórios
 * @param {string} query - Texto de busca
 * @returns {Array} - Relatórios que correspondem à busca
 */
export const searchReports = (reports, query) => {
  if (!query || query.trim() === '') return reports

  const lowerQuery = query.toLowerCase().trim()

  return reports.filter(report => {
    const titleMatch = (report.title || '').toLowerCase().includes(lowerQuery)
    const excerptMatch = (report.excerpt || '').toLowerCase().includes(lowerQuery)
    const tagsMatch = report.tags?.some(tag =>
      tag.toLowerCase().includes(lowerQuery)
    ) || false

    return titleMatch || excerptMatch || tagsMatch
  })
}

/**
 * Filtra relatórios por tags
 * @param {Array} reports - Array de relatórios
 * @param {Array} tags - Array de tags para filtrar
 * @returns {Array} - Relatórios que contêm pelo menos uma das tags
 */
export const filterByTags = (reports, tags) => {
  if (!tags || tags.length === 0) return reports
  
  return reports.filter(report => {
    if (!report.tags || report.tags.length === 0) return false
    return tags.some(tag => 
      report.tags.some(reportTag => 
        reportTag.toLowerCase() === tag.toLowerCase()
      )
    )
  })
}

/**
 * Obtém todas as tags únicas de um array de relatórios
 * @param {Array} reports - Array de relatórios
 * @returns {Array} - Array de tags únicas, ordenadas alfabeticamente
 */
export const getAllTags = (reports) => {
  const tagSet = new Set()
  
  reports.forEach(report => {
    if (report.tags && Array.isArray(report.tags)) {
      report.tags.forEach(tag => tagSet.add(tag.toLowerCase()))
    }
  })
  
  return Array.from(tagSet).sort()
}

/**
 * Pagina um array de relatórios
 * @param {Array} reports - Array de relatórios
 * @param {number} page - Número da página (começa em 1)
 * @param {number} perPage - Itens por página
 * @returns {Object} - { items, totalPages, currentPage, total }
 */
export const paginateReports = (reports, page = 1, perPage = 12) => {
  const total = reports.length
  const totalPages = Math.ceil(total / perPage)
  const currentPage = Math.max(1, Math.min(page, totalPages))
  const startIndex = (currentPage - 1) * perPage
  const endIndex = startIndex + perPage
  const items = reports.slice(startIndex, endIndex)

  return {
    items,
    totalPages,
    currentPage,
    total,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  }
}

/**
 * Obtém relatórios relacionados (mesma categoria, excluindo o atual)
 * @param {Array} reports - Array de todos os relatórios
 * @param {Object} currentReport - Relatório atual
 * @param {number} limit - Número máximo de relacionados (padrão: 3)
 * @returns {Array} - Relatórios relacionados
 */
export const getRelatedReports = (reports, currentReport, limit = 3) => {
  return reports
    .filter(report => 
      report.id !== currentReport.id && 
      report.category === currentReport.category
    )
    .slice(0, limit)
}

