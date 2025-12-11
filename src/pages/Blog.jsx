import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Tag, Zap, Loader2, AlertCircle } from 'lucide-react'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import { validateAndNormalizeReports } from '../utils/validateReport'
import { getReportsFromApi } from '../api/getReports'
import { filterByCategory, formatDate, getCategoryEmoji } from '../utils/reportHelpers'

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
  const navigate = useNavigate()

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        setError(null)

        const cached = localStorage.getItem('reports_cache')
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            setPosts(parsed)
          } catch (e) {
            console.warn('Não foi possível usar cache local', e)
          }
        }

        const { reports } = await getReportsFromApi(60)
        const normalized = validateAndNormalizeReports(reports || [])
        setPosts(normalized)
        localStorage.setItem('reports_cache', JSON.stringify(normalized))
      } catch (err) {
        console.warn('Erro na API, carregando fallback:', err)
        setError('Não foi possível atualizar os relatórios agora.')

        try {
          const localData = await import('../data/reports.example.json')
          const normalized = validateAndNormalizeReports(localData.default.reports || [])
          setPosts(normalized)
        } catch (e) {
          console.warn('Fallback local indisponível', e)
          setPosts([])
        }
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const filteredPosts = filterByCategory(posts, activeFilter)

  const handleReadMore = (post) => {
    if (post.contentUrl) {
      window.open(post.contentUrl, '_blank', 'noopener,noreferrer')
      return
    }

    navigate(`/blog/${post.slug}`)
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
          <div className="flex flex-wrap justify-center gap-3">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  activeFilter === filter.id
                    ? 'bg-cyan-luminous text-space-blue glow-cyan'
                    : 'bg-white/5 text-blue-gray hover:bg-white/10 hover:text-mist-gray'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
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
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="h-full flex flex-col">
                  {/* Capa ou Thumbnail */}
                  {post.thumbnail ? (
                    <div className="h-48 rounded-lg mb-4 overflow-hidden">
                      <img
                        src={post.thumbnail}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-cyan-luminous/20 to-electric-blue/20 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-4xl opacity-50">
                        {getCategoryEmoji(post.category)}
                      </div>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    {post.isNew && (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-neon-green/20 text-neon-green text-xs font-semibold rounded">
                        <span>✨</span>
                        <span>Novo</span>
                      </span>
                    )}
                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-cyan-luminous/10 text-cyan-luminous text-xs font-semibold rounded">
                      <Zap className="w-3 h-3" />
                      <span>Gerado pelo Motor</span>
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <h2 className="text-xl font-bold text-mist-gray mb-3 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-blue-gray text-sm mb-4 flex-grow line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={`${post.id}-tag-${idx}`}
                          className="px-2 py-1 bg-white/5 text-blue-gray text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-blue-gray pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(post.date)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Tag className="w-3 h-3" />
                      <span className="capitalize">{post.category}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    {post.contentUrl && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full sm:w-auto"
                        href={post.contentUrl}
                        target="_blank"
                      >
                        Abrir PDF
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => handleReadMore(post)}
                    >
                      {post.content ? 'Ler no portal' : 'Ler mais'}
                    </Button>
                  </div>
                </Card>
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

