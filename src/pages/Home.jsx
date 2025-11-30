import { motion } from 'framer-motion'
import { ArrowRight, Bot, BarChart3, FileText, MessageSquare, Zap } from 'lucide-react'
import ParticleBackground from '../components/UI/ParticleBackground'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'
import PipelineVisualization from '../components/UI/PipelineVisualization'

const Home = () => {
  const useCases = [
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: 'Atendimento Automatizado',
      description: 'Chatbots inteligentes que entendem contexto e resolvem problemas 24/7',
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: 'Robôs Corporativos',
      description: 'Automação de processos internos com IA contextual e decisões inteligentes',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Análise Automatizada',
      description: 'Processamento e análise de dados em tempo real com insights acionáveis',
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Relatórios Inteligentes',
      description: 'Geração automática de relatórios estratégicos com visualizações avançadas',
    },
  ]

  return (
    <div className="relative">
      <ParticleBackground particleCount={50} />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6">
              <span className="text-gradient-cyan">
                Automação inteligente que pensa, decide e entrega.
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-blue-gray mb-8 max-w-3xl mx-auto">
              Transformamos processos complexos em sistemas inteligentes que trabalham sozinhos.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Button
                size="lg"
                href="/automacao"
                className="group"
              >
                Conheça o Motor Inteligente
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Motor Inteligente Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-gradient-cyan">Aqui está como suas automações funcionam</span>
            </h2>
            <p className="text-blue-gray text-lg max-w-2xl mx-auto">
              Um motor inteligente que processa, analisa e executa de forma autônoma
            </p>
          </motion.div>

          <PipelineVisualization />
        </div>
      </section>

      {/* Casos de Uso */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-graphite-cold/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-gradient-cyan">Casos de Uso Imediatos</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="h-full">
                  <div className="text-cyan-luminous mb-4">{useCase.icon}</div>
                  <h3 className="text-xl font-bold text-mist-gray mb-3">
                    {useCase.title}
                  </h3>
                  <p className="text-blue-gray text-sm">
                    {useCase.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimento */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card glow className="text-center">
              <div className="mb-4">
                <Zap className="w-12 h-12 text-cyan-luminous mx-auto mb-4" />
                <span className="inline-block px-3 py-1 bg-cyan-luminous/10 text-cyan-luminous text-xs font-semibold rounded-full mb-4">
                  Gerado pelo Motor Inteligente
                </span>
              </div>
              <blockquote className="text-xl sm:text-2xl text-mist-gray italic mb-4">
                "Estas análises que você vê no blog são produzidas pelo nosso próprio motor de automação."
              </blockquote>
              <p className="text-blue-gray">
                — Sistema de Automação Inteligente
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              <span className="text-gradient-cyan">Pronto para automatizar?</span>
            </h2>
            <p className="text-xl text-blue-gray mb-8 max-w-2xl mx-auto">
              Ative o IA-Attendant no WhatsApp e experimente nossa automação inteligente agora mesmo.
            </p>
            <Button
              size="lg"
              href="https://wa.me/5511999999999"
              target="_blank"
              className="group"
            >
              <MessageSquare className="mr-2 w-5 h-5" />
              Fale com o IA-Attendant
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home

