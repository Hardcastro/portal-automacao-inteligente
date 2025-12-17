import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, AlertCircle, Loader2, Sparkles, Database } from 'lucide-react'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'

const WEBHOOK_URL = import.meta.env.VITE_ACTIVEPIECES_WEBHOOK_BLOG

const BlogPost = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [cachedReports, setCachedReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadFromCache = () => {
      const local = JSON.parse(localStorage.getItem('activepiecesReports') || '[]')
      if (local.length > 0) setCachedReports(local)
    }

    const fetchNewReports = async () => {
      try {
        if (!WEBHOOK_URL) {
          throw new Error('Webhook não configurado')
        }

        const res = await fetch(WEBHOOK_URL)
        const data = await res.json()
        if (!isMounted) return
        const normalizedData = Array.isArray(data) ? data : []
        setCachedReports(normalizedData)
        localStorage.setItem('activepiecesReports', JSON.stringify(normalizedData))
        setError(null)
      } catch (err) {
        console.warn('Falha ao atualizar dados do Activepieces:', err)
        if (isMounted) {
          setError('Não foi possível atualizar os relatórios agora.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadFromCache()
    fetchNewReports()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    if (slug && cachedReports.length > 0) {
      const match = cachedReports.find((post) => post.slug === slug)
      if (match) {
        console.info('[analytics] view blogpost', { slug: match.slug })
      }
    }
  }, [cachedReports, slug])

  const reportsToRender = useMemo(
    () => (slug ? cachedReports.filter((item) => item.slug === slug) : cachedReports),
    [cachedReports, slug]
  )

  if (loading && reportsToRender.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-luminous animate-spin mx-auto mb-4" />
          <p className="text-blue-gray">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  if (!cachedReports.length && !loading) {
    return <p className="text-center text-blue-gray">Nenhum relatório disponível.</p>
  }

  return (
    <article className="min-h-screen">
      <section className="section-shell border-b border-white/10 bg-graphite-cold/30">
        <div className="section-container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between flex-wrap gap-4"
          >
            <div className="space-y-2">
              <Link
                to="/blog"
                className="inline-flex items-center space-x-2 text-blue-gray hover:text-cyan-luminous transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao blog</span>
              </Link>
              <h1 className="text-3xl sm:text-4xl font-bold text-mist-gray">
                Leituras do motor inteligente
              </h1>
              <p className="text-blue-gray max-w-2xl">
                Publicações geradas automaticamente e servidas via Activepieces. O conteúdo é salvo localmente e atualizado
                assim que o webhook envia novos dados.
              </p>
            </div>
            <Card className="min-w-[240px]" hover={false}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-cyan-luminous/10 text-cyan-luminous">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-cyan-luminous/80 mb-1">Conteúdo ativo</p>
                  <p className="text-xl font-semibold text-mist-gray">{reportsToRender.length} posts</p>
                  <div className="flex items-center gap-2 text-blue-gray text-sm">
                    <Database className="w-4 h-4" />
                    <span>{WEBHOOK_URL ? 'Webhook público' : 'Cache local'}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="section-shell">
        <div className="section-container max-w-4xl space-y-6">
          {error && (
            <Card className="border border-amber-300/30 bg-amber-500/5" hover={false}>
              <div className="flex items-center gap-3 text-amber-200">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            </Card>
          )}

          {reportsToRender.map((post) => (
            <Card key={post.slug} className="mb-6">
              <h2 className="text-2xl font-bold text-mist-gray mb-2">{post.title}</h2>
              <p className="text-blue-gray text-sm mb-4">Por {post.author} — {post.date}</p>
              <div
                className="prose prose-invert"
                dangerouslySetInnerHTML={{ __html: post.content?.body || '' }}
              />
            </Card>
          ))}
        </div>
      </section>

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
