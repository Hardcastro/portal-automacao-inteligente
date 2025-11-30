import { motion } from 'framer-motion'
import { Newspaper, Brain, FileText, BarChart3, ArrowRight, Zap } from 'lucide-react'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import PipelineVisualization from '../components/UI/PipelineVisualization'

const ComoAutomatizamos = () => {
  const pipelineSteps = [
    {
      id: 1,
      icon: <Newspaper className="w-8 h-8" />,
      title: 'IA Interpreta Notícias',
      description: 'Sistema de IA contextual processa notícias de múltiplas fontes, identifica padrões e extrai insights relevantes.',
      color: 'cyan',
    },
    {
      id: 2,
      icon: <Brain className="w-8 h-8" />,
      title: 'Processamento Inteligente',
      description: 'Análise profunda com modelos de linguagem avançados que compreendem contexto e nuances.',
      color: 'blue',
    },
    {
      id: 3,
      icon: <FileText className="w-8 h-8" />,
      title: 'Alimenta o Blog',
      description: 'Geração automática de artigos estratégicos com análises profundas e visualizações.',
      color: 'cyan',
    },
    {
      id: 4,
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Alimenta o Dashboard',
      description: 'Atualização em tempo real de indicadores, gráficos e métricas estratégicas.',
      color: 'green',
    },
  ]

  const caseStudyPoints = [
    {
      title: 'Coleta Automatizada',
      description: 'Sistema coleta dados de mais de 50 fontes confiáveis 24/7',
      metric: '50+ fontes',
    },
    {
      title: 'Processamento em Tempo Real',
      description: 'Análise e processamento acontecem em segundos após a coleta',
      metric: '< 5 segundos',
    },
    {
      title: 'Geração Automática',
      description: 'Artigos e análises são gerados automaticamente sem intervenção humana',
      metric: '100% automático',
    },
    {
      title: 'Atualização Contínua',
      description: 'Dashboard atualizado constantemente com os dados mais recentes',
      metric: 'Real-time',
    },
  ]

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
              <span className="text-gradient-cyan">Como Automatizamos Nosso Próprio Portal</span>
            </h1>
            <p className="text-xl text-blue-gray mb-8">
              Esta página é a prova viva do nosso produto. Veja como o Motor Inteligente alimenta este portal automaticamente.
            </p>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-luminous/10 rounded-full">
              <Zap className="w-4 h-4 text-cyan-luminous" />
              <span className="text-sm text-cyan-luminous font-semibold">
                Case Study Vivo
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Fluxo Completo */}
      <section className="section-shell bg-graphite-cold/30">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="section-header"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-gradient-cyan">Fluxo Completo do Pipeline</span>
            </h2>
            <p className="text-blue-gray text-lg max-w-3xl mx-auto">
              Do processamento de notícias até a publicação automática, veja como tudo funciona.
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto mb-12">
            <PipelineVisualization 
              steps={pipelineSteps.map(s => ({ 
                id: s.id, 
                label: s.title, 
                icon: s.icon, 
                color: s.color 
              }))} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pipelineSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card
                  className={`h-full border-2 ${
                    step.color === 'cyan' ? 'border-cyan-luminous glow-cyan' :
                    step.color === 'blue' ? 'border-electric-blue glow-blue' :
                    'border-neon-green glow-green'
                  }`}
                >
                  <div className={`mb-4 ${
                    step.color === 'cyan' ? 'text-cyan-luminous' :
                    step.color === 'blue' ? 'text-electric-blue' :
                    'text-neon-green'
                  }`}>
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-mist-gray mb-3">
                    {step.title}
                  </h3>
                  <p className="text-blue-gray text-sm">
                    {step.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Diagrama Interativo */}
      <section className="section-shell">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="section-header"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-gradient-cyan">Diagrama Interativo</span>
            </h2>
            <p className="text-blue-gray text-lg max-w-3xl mx-auto">
              Visualize como os dados fluem através do sistema, desde a coleta até a apresentação.
            </p>
          </motion.div>

          <Card glow className="max-w-5xl mx-auto">
            <div className="relative p-8">
              {/* Linhas de conexão animadas */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                <motion.path
                  d="M 100 200 Q 300 200, 500 200"
                  stroke="url(#gradient1)"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00E5FF" stopOpacity="0" />
                    <stop offset="50%" stopColor="#00E5FF" stopOpacity="1" />
                    <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6">
                {pipelineSteps.map((step, index) => (
                  <div key={step.id} className="text-center">
                    <div className={`
                      w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center
                      ${step.color === 'cyan' ? 'bg-cyan-luminous/20 border-2 border-cyan-luminous' :
                        step.color === 'blue' ? 'bg-electric-blue/20 border-2 border-electric-blue' :
                        'bg-neon-green/20 border-2 border-neon-green'}
                    `}>
                      {step.icon}
                    </div>
                    <h3 className="text-sm font-semibold text-mist-gray mb-2">
                      {step.title}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Case Study Visual */}
      <section className="section-shell bg-graphite-cold/30">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="section-header"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-gradient-cyan">Métricas do Case Study</span>
            </h2>
            <p className="text-blue-gray text-lg max-w-3xl mx-auto">
              Números reais do sistema que alimenta este portal automaticamente.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {caseStudyPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="text-center h-full">
                  <div className="text-3xl font-bold text-gradient-cyan mb-2">
                    {point.metric}
                  </div>
                  <h3 className="text-lg font-semibold text-mist-gray mb-2">
                    {point.title}
                  </h3>
                  <p className="text-blue-gray text-sm">
                    {point.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Prova Viva */}
      <section className="section-shell">
        <div className="section-container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card glow className="text-center">
              <Zap className="w-16 h-16 text-cyan-luminous mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-mist-gray mb-4">
                Esta Página é a Prova Viva
              </h2>
              <p className="text-lg text-blue-gray mb-6">
                Todo o conteúdo que você vê aqui — desde o blog até o dashboard — é gerado automaticamente pelo nosso Motor Inteligente. 
                Não há intervenção humana no processo de criação e atualização.
              </p>
              <p className="text-base text-blue-gray mb-8">
                Este é o poder da automação inteligente: sistemas que trabalham sozinhos, 
                24 horas por dia, 7 dias por semana, gerando valor contínuo.
              </p>
              <Button
                size="lg"
                href="/automacao"
                className="group"
              >
                Conheça o Motor Inteligente
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default ComoAutomatizamos

