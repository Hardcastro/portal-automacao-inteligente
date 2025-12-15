import { useEffect, useMemo, useState } from 'react'
import { paginateReports, searchReports } from '../utils/reportHelpers'

const sanitizeAuthor = (author) => author || 'Desconhecido'

const getYear = (dateString) => {
  const parsed = new Date(dateString)
  const year = parsed.getFullYear()
  return Number.isNaN(year) ? null : year
}

const uniqueValues = (items) => Array.from(new Set(items.filter(Boolean)))

const sortYearsDesc = (years) => [...years].sort((a, b) => b - a)

export const useReportsFilters = (reports, { perPage = 10 } = {}) => {
  const [activeCategory, setActiveCategory] = useState('todos')
  const [activeAuthor, setActiveAuthor] = useState('todos')
  const [activeYear, setActiveYear] = useState('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategory, activeAuthor, activeYear, debouncedQuery, reports])

  const { categories, authors, years } = useMemo(() => {
    const categoryOptions = uniqueValues(reports.map((report) => report.category)).sort()
    const authorOptions = uniqueValues(reports.map((report) => sanitizeAuthor(report.author))).sort((a, b) =>
      a.localeCompare(b, 'pt-BR')
    )
    const yearOptions = sortYearsDesc(uniqueValues(reports.map((report) => getYear(report.date)))).map(String)

    return {
      categories: ['todos', ...categoryOptions],
      authors: ['todos', ...authorOptions],
      years: ['todos', ...yearOptions]
    }
  }, [reports])

  const filteredReports = useMemo(() => {
    let result = [...reports]

    if (activeCategory !== 'todos') {
      result = result.filter((report) => report.category === activeCategory)
    }

    if (activeAuthor !== 'todos') {
      result = result.filter((report) => sanitizeAuthor(report.author) === activeAuthor)
    }

    if (activeYear !== 'todos') {
      result = result.filter((report) => getYear(report.date) === Number(activeYear))
    }

    result = searchReports(result, debouncedQuery)
    return result
  }, [activeAuthor, activeCategory, activeYear, debouncedQuery, reports])

  const pagination = useMemo(() => paginateReports(filteredReports, currentPage, perPage), [filteredReports, currentPage, perPage])

  const goToPage = (page) => {
    setCurrentPage((current) => {
      const safePage = typeof page === 'number' ? page : current
      const clamped = Math.min(Math.max(safePage, 1), Math.max(pagination.totalPages, 1))
      return clamped
    })
  }

  return {
    categories,
    authors,
    years,
    activeCategory,
    activeAuthor,
    activeYear,
    searchQuery,
    setActiveCategory,
    setActiveAuthor,
    setActiveYear,
    setSearchQuery,
    setCurrentPage: goToPage,
    paginatedReports: pagination.items,
    paginationMeta: {
      totalPages: pagination.totalPages,
      currentPage: pagination.currentPage,
      total: pagination.total,
      hasNext: pagination.hasNext,
      hasPrev: pagination.hasPrev
    }
  }
}

export default useReportsFilters
