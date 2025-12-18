import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, AlertCircle, Loader2, Sparkles, Database, RefreshCw } from 'lucide-react'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import { getReportBySlug } from '../api/reportsClient'

const buildSourceLabel = (source) => {
  if (source === 'fallback') return 'Fallback estático'
  if (source === 'cache') return 'Cache local'
  return 'API do backend'
}

const BlogPost = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReport = useCallback(async () => {
    if (!slug) return

    setLoading(true)
    setError(null)
    try {
      const result = await getReportBySlug(slug)
      setReport(result)
      if (!result) {
        setError('Relatório não encontrado.')
      }
    } catch (err) {
      console.warn('Erro ao carregar relatório', err)
      setError('Não foi possível carregar o relatório agora.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  useEffect(() => {
    if (slug && report?.slug === slug) {
      console.info('[analytics] view blogpost', { slug: report.slug })
    }
  }, [report, slug])

  const heroDescription = useMemo(() => (
    'Publicações geradas automaticamente e servidas pela API do backend. '
    + 'O conteúdo é salvo localmente e entregue de forma consistente para todo o site.'
  ), [])

  if (loading && !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-luminous animate-spin mx-auto mb-4" />
          <p className="text-blue-gray">Carregando relatório...</p>
        </div>
      </div>
    )
  }

  const renderErrorCard = (message) => (
    <Card className="border border-amber-300/30 bg-amber-500/5" hover={false}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-amber-200">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{message}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReport} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
          <Button variant="secondary" onClick={() => navigate('/blog')}>
            Ver outros relatórios
          </Button>
        </div>
      </div>
    </Card>
  )

  if (error && !report) {
    return (
      <div className="section-shell">
        <div className="section-container max-w-4xl space-y-4">
          {renderErrorCard(error)}
        </div>
      </div>
    )
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
              <p className="text-blue-gray max-w-2xl">{heroDescription}</p>
            </div>
            <Card className="min-w-[240px]" hover={false}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-cyan-luminous/10 text-cyan-luminous">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-cyan-luminous/80 mb-1">Fonte de dados</p>
                  <p className="text-xl font-semibold text-mist-gray">{buildSourceLabel(report?.dataSource)}</p>
                  <div className="flex items-center gap-2 text-blue-gray text-sm">
                    <Database className="w-4 h-4" />
                    <span>{report?.isFallback ? 'Fallback' : 'API principal'}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="section-shell">
        <div className="section-container max-w-4xl space-y-6">
          {error && renderErrorCard(error)}

          {report && (
            <Card key={report.slug} className="mb-6">
              <h2 className="text-2xl font-bold text-mist-gray mb-2">{report.title}</h2>
              <p className="text-blue-gray text-sm mb-4">Por {report.author} — {report.date}</p>
              <div
                className="prose prose-invert"
                dangerouslySetInnerHTML={{ __html: report.content?.body || '' }}
              />
            </Card>
          )}

          {!report && !error && (
            <Card className="text-center" hover={false}>
              <p className="text-blue-gray">Nenhum relatório disponível.</p>
              <div className="mt-4 flex gap-2 justify-center">
                <Button variant="outline" onClick={fetchReport}>
                  Recarregar
                </Button>
                <Button onClick={() => navigate('/blog')}>Voltar</Button>
              </div>
            </Card>
          )}
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
