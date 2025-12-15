import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Loader2, AlertCircle, Search, Filter, Database } from 'lucide-react'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import ReportCard from '../components/ReportCard'
import { getReportBySlug, getReports, readCachedReports } from '../api/getReports'
import { RECOMMENDED_LIMIT } from '../constants'
import { filterByCategory, searchReports } from '../utils/reportHelpers'

const filters = [
  { id: 'todos', label: 'Todos' },
  { id: 'geopolitica', label: 'Geopolítica' },
  { id: 'macroeconomia', label: 'Macroeconomia' },
  { id: 'tendencias', label: 'Tendências' },
  { id: 'mercados', label: 'Mercados' },
]

const Blog = () => {
  const [activeFilter, setActiveFilter] = useState('todos')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [usedFallback, setUsedFallback] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      setLoading(true)
      setError(null)

      const cached = readCachedReports()
      if (cached?.reports?.length && isMounted) {
        setPosts(cached.reports)
      }

      try {
        const { reports, meta } = await getReports(RECOMMENDED_LIMIT)
        if (!isMounted) return
        setPosts(reports)
        const fallback = Boolean(meta?.isFallback)
        setUsedFallback(fallback)
        if (fallback) {
          setError('Não foi possível atualizar os relatórios agora.')
        }
      } catch (err) {
        console.warn('Erro ao carregar relatórios', err)
        if (isMounted) setError('Não foi possível atualizar os relatórios agora.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    bootstrap()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredPosts = useMemo(() => {
    const byCategory = filterByCategory(posts, activeFilter)
    return searchReports(byCategory, searchQuery)
  }, [posts, activeFilter, searchQuery])

  const handleReadMore = (post) => {
    console.info('[analytics] click ver relatorio', { slug: post.slug })
    navigate(`/blog/${post.slug}`)
  }

  const handlePrefetch = (post) => {
    getReportBySlug(post.slug, RECOMMENDED_LIMIT).catch(() => {
      console.warn('Falha ao pré-carregar relatório', post.slug)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-luminous animate-spin mx-auto mb-4" />
          <p className="text-blue-gray">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-mist-gray mb-2">Nenhum relatório disponível</h2>
          <p className="text-blue-gray mb-4">
            {error || 'Tente novamente mais tarde.'}
          </p>
          <Button onClick={() => window.location.reload()}>Recarregar</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section-shell">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="section-header max-w-4xl"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-gradient-cyan">Blog Estratégico</span>
            </h1>
            <p className="text-xl text-blue-gray mb-8">
              Insights automatizados sobre geopolítica, macroeconomia, tendências e mercados.
            </p>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-luminous/10 rounded-full">
              <Zap className="w-4 h-4 text-cyan-luminous" />
              <span className="text-sm text-cyan-luminous font-semibold">
                Gerado pelo Motor Inteligente
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filtros */}
      <section className="relative py-8 px-4 sm:px-6 lg:px-8 bg-graphite-cold/30">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-4 items-center">
            <div className="flex flex-wrap justify-center gap-3">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                    activeFilter === filter.id
                      ? 'bg-cyan-luminous text-space-blue glow-cyan'
                      : 'bg-white/5 text-blue-gray hover:bg-white/10 hover:text-mist-gray'
                  }`}
                  aria-pressed={activeFilter === filter.id}
                >
                  <Filter className="w-4 h-4" aria-hidden />
                  {filter.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2 text-blue-gray focus-within:ring-2 focus-within:ring-cyan-luminous">
              <Search className="w-4 h-4" aria-hidden />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, resumo ou tag"
                className="bg-transparent flex-1 outline-none text-sm"
                aria-label="Buscar relatórios"
              />
            </label>
          </div>
          {usedFallback && (
            <div className="mt-4 flex items-center gap-2 text-amber-200 text-sm">
              <Database className="w-4 h-4" />
              <span>Exibindo dados do fallback enquanto a API principal está indisponível.</span>
            </div>
          )}
        </div>
      </section>

      {/* Grid de Posts */}
      <section className="section-shell">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <ReportCard report={post} onReadMore={handleReadMore} onPrefetch={handlePrefetch} />
              </motion.div>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-blue-gray text-lg">
                Nenhum relatório encontrado nesta categoria.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Blog

