import { motion } from 'framer-motion'
import { Settings, BarChart3, History, Zap, Lock } from 'lucide-react'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'

const Cliente = () => {
  const features = [
    {
      icon: <Settings className="w-10 h-10" />,
      title: 'Configurações',
      description: 'Personalize suas automações e ajuste parâmetros conforme suas necessidades.',
      status: 'Em desenvolvimento',
    },
    {
      icon: <BarChart3 className="w-10 h-10" />,
      title: 'Dashboards Privados',
      description: 'Acesse dashboards personalizados com métricas e análises exclusivas.',
      status: 'Em desenvolvimento',
    },
    {
      icon: <History className="w-10 h-10" />,
      title: 'Histórico de Análises',
      description: 'Visualize todo o histórico de análises e relatórios gerados automaticamente.',
      status: 'Em desenvolvimento',
    },
    {
      icon: <Zap className="w-10 h-10" />,
      title: 'Automação Sob Medida',
      description: 'Gerencie e monitore suas automações personalizadas em tempo real.',
      status: 'Em desenvolvimento',
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
            <div className="inline-flex items-center space-x-2 mb-6">
              <Lock className="w-8 h-8 text-cyan-luminous" />
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                <span className="text-gradient-cyan">Área do Cliente</span>
              </h1>
            </div>
            <p className="text-xl text-blue-gray mb-8">
              Gerencie suas automações, visualize análises e configure seu ambiente personalizado.
            </p>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-gray/20 rounded-full">
              <span className="text-sm text-blue-gray font-semibold">
                Área restrita - Autenticação necessária
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
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
              <span className="text-gradient-cyan">Funcionalidades</span>
            </h2>
            <p className="text-blue-gray text-lg max-w-3xl mx-auto">
              Recursos que estarão disponíveis em breve na área do cliente.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="h-full opacity-75">
                  <div className="text-cyan-luminous mb-4">
                    {feature.icon}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-bold text-mist-gray">
                      {feature.title}
                    </h3>
                    <span className="px-3 py-1 bg-blue-gray/20 text-blue-gray text-xs font-semibold rounded-full">
                      {feature.status}
                    </span>
                  </div>
                  <p className="text-blue-gray">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Placeholder de Login */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-graphite-cold/30">
        <div className="container mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card glow className="text-center">
              <Lock className="w-16 h-16 text-cyan-luminous mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-mist-gray mb-4">
                Acesso Restrito
              </h2>
              <p className="text-blue-gray mb-6">
                Esta área está em desenvolvimento. Em breve, você poderá fazer login e acessar todas as funcionalidades.
              </p>
              <Button variant="secondary" size="md" disabled>
                Login (Em breve)
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Informação */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-blue-gray text-lg">
              Para mais informações sobre quando a área do cliente estará disponível, 
              entre em contato conosco através do{' '}
              <a 
                href="/contato" 
                className="text-cyan-luminous hover:text-electric-blue transition-colors underline"
              >
                formulário de contato
              </a>
              {' '}ou pelo WhatsApp.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Cliente

