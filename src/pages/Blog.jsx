import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Database, Loader2, Sparkles, Zap } from 'lucide-react'
import { getReports } from '../api/getReports'
import ReportCard from '../components/ReportCard'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'

export default function Blog() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchReports = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getReports()
        if (!isMounted) return
        setReports(response.reports ?? [])
        setMeta(response.meta ?? {})
      } catch (err) {
        console.error('Erro ao buscar relatórios:', err)
        if (isMounted) setError('Não foi possível carregar os relatórios agora.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchReports()

    return () => {
      isMounted = false
    }
  }, [])

  const handleReadMore = (report) => {
    navigate(`/blog/${report.slug}`)
  }

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={`skeleton-${index}`} className="h-full animate-pulse" hover={false}>
          <div className="h-48 bg-white/5 rounded-lg mb-4" />
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-full" />
            <div className="h-3 bg-white/5 rounded w-5/6" />
            <div className="flex gap-2 pt-2">
              <span className="h-6 w-20 bg-white/10 rounded-full" />
              <span className="h-6 w-24 bg-white/10 rounded-full" />
            </div>
            <div className="h-10 bg-white/5 rounded" />
          </div>
        </Card>
      ))}
    </div>
  )

  const renderEmptyState = () => (
    <Card className="text-center max-w-xl mx-auto" hover={false}>
      <div className="flex justify-center mb-4">
        <Sparkles className="w-10 h-10 text-cyan-luminous" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Nenhum relatório disponível</h2>
      <p className="text-blue-gray mb-4">
        Assim que o motor inteligente publicar novas análises, elas aparecerão aqui. Enquanto isso, explore nossas outras seções.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button variant="secondary" href="/automacao">
          Ver o motor em ação
        </Button>
        <Button variant="outline" href="/dashboard">
          Conferir dashboards
        </Button>
      </div>
    </Card>
  )

  return (
    <div className="min-h-screen">
      <section className="section-shell border-b border-white/10 bg-graphite-cold/30">
        <div className="section-container grid lg:grid-cols-[1.5fr_1fr] gap-12 items-center">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-luminous/10 text-cyan-luminous rounded-full text-sm font-semibold"
            >
              <Zap className="w-4 h-4" />
              Conteúdo gerado pelo motor inteligente
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold"
            >
              <span className="text-gradient-cyan">Blog &amp; Insights</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-blue-gray text-lg max-w-2xl"
            >
              Acompanhe os relatórios mais recentes produzidos automaticamente pelo nosso motor de automação, com análises, métricas e experimentos em tempo real.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap gap-4"
            >
              <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 min-w-[180px]">
                <p className="text-xs uppercase tracking-widest text-cyan-luminous/80 mb-1">Relatórios ativos</p>
                <p className="text-3xl font-semibold">{reports.length}</p>
                {meta?.isFallback && (
                  <p className="text-amber-200 text-xs mt-1">Conteúdo via fallback</p>
                )}
              </div>
              <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 min-w-[180px]">
                <p className="text-xs uppercase tracking-widest text-cyan-luminous/80 mb-1">Fonte de dados</p>
                <div className="flex items-center gap-2 text-blue-gray">
                  <Database className="w-4 h-4" />
                  <span className="capitalize">{meta?.isFallback ? 'Fallback/Cache' : 'API principal'}</span>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Card glow className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-luminous/10 via-electric-blue/5 to-transparent" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-2 text-cyan-luminous">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold">Atualizado em tempo real</span>
                </div>
                <h2 className="text-2xl font-bold">O motor aprende e publica sozinho.</h2>
                <p className="text-blue-gray">
                  Cada insight aqui é gerado automaticamente com base nos dados processados pelo pipeline de automação.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button href="/dashboard" variant="secondary" className="group">
                    Ver dashboards
                    <span aria-hidden className="group-hover:translate-x-1 transition-transform">→</span>
                  </Button>
                  <Button href="/contato" variant="outline">
                    Fale com o time
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="section-shell">
        <div className="section-container">
          <div className="section-header">
            <h2 className="text-3xl font-bold mb-4">Últimos relatórios</h2>
            <p className="text-blue-gray">
              Explore as publicações mais recentes produzidas pelo motor de automação. Clique para ler a análise completa.
            </p>
          </div>

          {error && (
            <Card className="max-w-xl mx-auto mb-10 text-center border-red-500/30">
              <div className="flex justify-center mb-4">
                <Loader2 className="w-10 h-10 text-red-300 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Não conseguimos carregar o blog</h3>
              <p className="text-blue-gray mb-4">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </Card>
          )}

          {loading && renderSkeletons()}

          {!loading && !error && reports.length === 0 && renderEmptyState()}

          {!loading && !error && reports.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onReadMore={handleReadMore}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
