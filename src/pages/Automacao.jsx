import { motion } from 'framer-motion'
import { Brain, Workflow, MessageCircle, BarChart3, ArrowRight, MessageSquare } from 'lucide-react'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'
import PipelineVisualization from '../components/UI/PipelineVisualization'

const Automacao = () => {
  const processSteps = [
    { id: 1, label: 'Entrada', description: 'Coleta de dados de múltiplas fontes', icon: '📥' },
    { id: 2, label: 'Interpretação', description: 'IA contextual analisa e compreende', icon: '🧠' },
    { id: 3, label: 'Decisão', description: 'Sistema toma decisões inteligentes', icon: '⚡' },
    { id: 4, label: 'Execução', description: 'Ações automáticas são realizadas', icon: '🚀' },
  ]

  const motorComponents = [
    {
      icon: <Brain className="w-10 h-10" />,
      title: 'IA Contextual (MCP)',
      description: 'Modelo de contexto avançado que entende nuances e toma decisões inteligentes',
      color: 'cyan',
    },
    {
      icon: <Workflow className="w-10 h-10" />,
      title: 'Automação Modular (n8n)',
      description: 'Workflows flexíveis e escaláveis para qualquer processo',
      color: 'blue',
    },
    {
      icon: <MessageCircle className="w-10 h-10" />,
      title: 'Chatbots Avançados (WAHA + IA)',
      description: 'Assistentes virtuais que conversam naturalmente e resolvem problemas',
      color: 'cyan',
    },
    {
      icon: <BarChart3 className="w-10 h-10" />,
      title: 'Pipelines de Análise',
      description: 'Processamento e análise de dados em tempo real com visualizações',
      color: 'green',
    },
  ]

  const solutions = [
    {
      title: 'Automação de Atendimento',
      description: 'Sistema completo de atendimento automatizado com IA contextual',
      features: ['Chatbot 24/7', 'Triagem inteligente', 'Resolução automática'],
    },
    {
      title: 'Robôs para Empresas',
      description: 'Automação de processos internos com robôs inteligentes',
      features: ['RPA Avançado', 'Integração de sistemas', 'Monitoramento em tempo real'],
    },
    {
      title: 'Análise Automatizada',
      description: 'Processamento e análise de dados com insights acionáveis',
      features: ['ETL Automatizado', 'Machine Learning', 'Dashboards dinâmicos'],
    },
    {
      title: 'Soluções Personalizadas',
      description: 'Desenvolvimento sob medida para suas necessidades específicas',
      features: ['Consultoria', 'Desenvolvimento custom', 'Suporte contínuo'],
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-gradient-cyan">Automação Inteligente</span>
            </h1>
            <p className="text-xl text-blue-gray mb-8">
              Sistemas que pensam, decidem e executam de forma autônoma, transformando processos complexos em operações eficientes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* O que é Automação Inteligente */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-graphite-cold/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-gradient-cyan">O que é Automação Inteligente?</span>
            </h2>
            <p className="text-blue-gray text-lg max-w-3xl mx-auto">
              Um sistema que vai além da automação tradicional, combinando IA contextual, processamento inteligente e execução autônoma.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="text-center h-full">
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <h3 className="text-xl font-bold text-mist-gray mb-2">{step.label}</h3>
                  <p className="text-blue-gray text-sm">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="max-w-5xl mx-auto">
            <PipelineVisualization steps={processSteps.map(s => ({ ...s, color: 'cyan' }))} />
          </div>
        </div>
      </section>

      {/* Motor IA Operacional */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-gradient-cyan">O Motor IA Operacional</span>
            </h2>
            <p className="text-blue-gray text-lg max-w-3xl mx-auto">
              Componentes avançados que trabalham em conjunto para criar automações verdadeiramente inteligentes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {motorComponents.map((component, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card
                  className={`h-full border-2 ${
                    component.color === 'cyan' ? 'border-cyan-luminous glow-cyan' :
                    component.color === 'blue' ? 'border-electric-blue glow-blue' :
                    'border-neon-green glow-green'
                  }`}
                >
                  <div className={`mb-4 ${
                    component.color === 'cyan' ? 'text-cyan-luminous' :
                    component.color === 'blue' ? 'text-electric-blue' :
                    'text-neon-green'
                  }`}>
                    {component.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-mist-gray mb-3">
                    {component.title}
                  </h3>
                  <p className="text-blue-gray">
                    {component.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demonstração Visual */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-graphite-cold/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-gradient-cyan">Demonstração Visual Real</span>
            </h2>
            <p className="text-blue-gray text-lg max-w-3xl mx-auto">
              Veja como um pipeline completo funciona na prática, com exemplos reais de automação.
            </p>
          </motion.div>

          <Card glow className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <span className="text-mist-gray font-semibold">Pipeline em Execução</span>
                <span className="px-3 py-1 bg-neon-green/20 text-neon-green text-xs font-semibold rounded-full">
                  Ativo
                </span>
              </div>
              <PipelineVisualization />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-white/10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-luminous mb-1">24/7</div>
                  <div className="text-sm text-blue-gray">Disponibilidade</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-electric-blue mb-1">99.9%</div>
                  <div className="text-sm text-blue-gray">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-green mb-1">Real-time</div>
                  <div className="text-sm text-blue-gray">Processamento</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Pacotes / Soluções */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-gradient-cyan">Pacotes e Soluções</span>
            </h2>
            <p className="text-blue-gray text-lg max-w-3xl mx-auto">
              Escolha a solução ideal para suas necessidades ou solicite uma personalizada.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="h-full">
                  <h3 className="text-2xl font-bold text-mist-gray mb-3">
                    {solution.title}
                  </h3>
                  <p className="text-blue-gray mb-4">
                    {solution.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {solution.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-blue-gray text-sm">
                        <span className="w-2 h-2 bg-cyan-luminous rounded-full mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm">
                    Saiba mais
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-graphite-cold/30">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              <span className="text-gradient-cyan">Fale com o Motor no WhatsApp</span>
            </h2>
            <p className="text-xl text-blue-gray mb-8 max-w-2xl mx-auto">
              Experimente nossa automação inteligente agora mesmo através do IA-Attendant.
            </p>
            <Button
              size="lg"
              href="https://wa.me/5511999999999"
              target="_blank"
              className="group"
            >
              <MessageSquare className="mr-2 w-5 h-5" />
              Iniciar Conversa
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Automacao

