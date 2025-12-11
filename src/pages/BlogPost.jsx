import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Tag, Zap, Clock, Download, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import { validateAndNormalizeReports } from '../utils/validateReport'
import { formatDate, getCategoryName } from '../utils/reportHelpers'

const BlogPost = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        setError(null)

        // Estratégia A: API em tempo real
        const response = await fetch(`/api/reports/${slug}`, { cache: 'no-cache' })
        if (response.ok) {
          const data = await response.json()
          setPost(data)
          return
        }

        // Estratégia B: fallback local (JSON commitado)
        const localData = await import('../data/reports.example.json')
        const normalized = validateAndNormalizeReports(localData.default.reports || [])
        const found = normalized.find((item) => item.slug === slug)
        if (!found) throw new Error('Relatório não encontrado')
        setPost(found)
      } catch (err) {
        console.warn('Erro ao carregar relatório', err)
        setError('Não foi possível carregar este relatório.')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-luminous animate-spin mx-auto mb-4" />
          <p className="text-blue-gray">Carregando relatório...</p>
        </div>
      </div>
    )
  }

  if (!post || error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-mist-gray mb-2">Relatório não encontrado</h2>
          <p className="text-blue-gray mb-4">{error || 'O relatório solicitado não existe.'}</p>
          <Button onClick={() => navigate('/blog')}>Voltar ao blog</Button>
        </Card>
      </div>
    )
  }

  return (
    <article className="min-h-screen">
      {/* Header do Post */}
      <section className="section-shell border-b border-white/10">
        <div className="section-container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Breadcrumb */}
            <nav className="mb-6">
              <Link
                to="/blog"
                className="inline-flex items-center space-x-2 text-blue-gray hover:text-cyan-luminous transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao blog</span>
              </Link>
            </nav>

            {/* Badges */}
            <div className="mb-6 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-cyan-luminous/10 text-cyan-luminous text-sm font-semibold rounded-full">
                <Zap className="w-4 h-4" />
                <span>Gerado pelo Motor Inteligente</span>
              </span>
              <span className="px-3 py-1 bg-white/10 text-mist-gray text-sm font-medium rounded-full capitalize">
                {getCategoryName(post.category)}
              </span>
            </div>

            {/* Título */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-mist-gray mb-6">
              {post.title}
            </h1>

            {/* Meta informações */}
            <div className="flex flex-wrap items-center gap-6 text-blue-gray text-sm mb-8">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.date)}</span>
              </div>
              {post.readTime && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{post.readTime} min de leitura</span>
                </div>
              )}
              {post.author && (
                <div className="flex items-center space-x-2">
                  <span>Por {post.author}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag, idx) => (
                  <span
                    key={`${post.id}-tag-${idx}`}
                    className="px-3 py-1 bg-white/5 text-blue-gray text-sm rounded-full border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Ações (Download/Link) */}
            {post.contentUrl && (
              <div className="flex flex-wrap gap-3">
                {post.contentUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    href={post.contentUrl}
                    target="_blank"
                    className="inline-flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar PDF</span>
                  </Button>
                )}
                {post.contentUrl && (
                  <Button
                    variant="secondary"
                    size="sm"
                    href={post.contentUrl}
                    target="_blank"
                    className="inline-flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir em nova aba</span>
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <section className="section-shell">
        <div className="section-container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="prose prose-invert prose-lg max-w-none">
              {post.content && post.content.type === 'html' && (
                <div
                  className="report-content"
                  dangerouslySetInnerHTML={{ __html: post.content.body }}
                />
              )}

              {post.content && post.content.type === 'markdown' && (
                <div className="report-content whitespace-pre-wrap">
                  {post.content.body}
                </div>
              )}

              {post.contentUrl && !post.content && (
                <div className="w-full min-h-[400px] h-[70vh]">
                  <iframe
                    src={post.contentUrl}
                    className="w-full h-full rounded-lg border border-white/10"
                    title={post.title}
                  />
                </div>
              )}

              {!post.content && !post.contentUrl && (
                <div className="text-center py-12">
                  <p className="text-blue-gray">
                    Conteúdo não disponível no momento.
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Navegação */}
      <section className="section-shell border-t border-white/10">
        <div className="section-container max-w-4xl">
          <div className="text-center">
            <Button variant="outline" onClick={() => navigate('/blog')}>
              Ver todos os relatórios
            </Button>
          </div>
        </div>
      </section>
    </article>
  )
}

export default BlogPost

