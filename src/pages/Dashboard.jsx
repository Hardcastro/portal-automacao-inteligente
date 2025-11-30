import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Globe, DollarSign, BarChart3 } from 'lucide-react'
import Card from '../components/UI/Card'

const Dashboard = () => {
  const indicators = [
    {
      title: 'Petróleo (WTI)',
      value: '$78.50',
      change: '+2.3%',
      trend: 'up',
      color: 'cyan',
    },
    {
      title: 'Ouro',
      value: '$2,045',
      change: '-0.5%',
      trend: 'down',
      color: 'green',
    },
    {
      title: 'Bitcoin',
      value: '$42,300',
      change: '+5.2%',
      trend: 'up',
      color: 'cyan',
    },
    {
      title: 'Dólar (USD/BRL)',
      value: 'R$ 4.92',
      change: '+0.8%',
      trend: 'up',
      color: 'blue',
    },
  ]

  const inflationData = [
    { country: 'EUA', value: 3.2, color: 'cyan' },
    { country: 'Brasil', value: 4.6, color: 'blue' },
    { country: 'UE', value: 2.9, color: 'green' },
    { country: 'China', value: 0.1, color: 'cyan' },
  ]

  const rankings = [
    { position: 1, country: 'Estados Unidos', score: 95.2, change: '+0.3' },
    { position: 2, country: 'China', score: 88.7, change: '+1.2' },
    { position: 3, country: 'Alemanha', score: 82.1, change: '-0.5' },
    { position: 4, country: 'Japão', score: 78.9, change: '+0.8' },
    { position: 5, country: 'Reino Unido', score: 75.4, change: '-0.2' },
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
              <span className="text-gradient-cyan">Dashboard Estratégico</span>
            </h1>
            <p className="text-xl text-blue-gray mb-8">
              Painel vivo com indicadores globais em tempo real, gerado automaticamente pelo Motor Inteligente.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Indicadores Principais */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {indicators.map((indicator, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card
                  className={`border-2 ${
                    indicator.color === 'cyan' ? 'border-cyan-luminous glow-cyan' :
                    indicator.color === 'blue' ? 'border-electric-blue glow-blue' :
                    'border-neon-green glow-green'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-blue-gray">
                      {indicator.title}
                    </h3>
                    {indicator.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-neon-green" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-mist-gray mb-1">
                    {indicator.value}
                  </div>
                  <div className={`text-sm font-semibold ${
                    indicator.trend === 'up' ? 'text-neon-green' : 'text-red-400'
                  }`}>
                    {indicator.change}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gráficos e Visualizações */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8 bg-graphite-cold/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inflação Global */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Card>
                <div className="flex items-center space-x-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-cyan-luminous" />
                  <h2 className="text-xl font-bold text-mist-gray">Inflação Global</h2>
                </div>
                <div className="space-y-4">
                  {inflationData.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-gray">
                          {item.country}
                        </span>
                        <span className="text-sm font-bold text-mist-gray">
                          {item.value}%
                        </span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.value * 10}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1, duration: 1 }}
                          className={`h-full ${
                            item.color === 'cyan' ? 'bg-cyan-luminous glow-cyan' :
                            item.color === 'blue' ? 'bg-electric-blue glow-blue' :
                            'bg-neon-green glow-green'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Mapa-Múndi (Placeholder) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Card>
                <div className="flex items-center space-x-2 mb-6">
                  <Globe className="w-5 h-5 text-cyan-luminous" />
                  <h2 className="text-xl font-bold text-mist-gray">Calor Geopolítico</h2>
                </div>
                <div className="h-64 bg-gradient-to-br from-cyan-luminous/10 to-electric-blue/10 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Globe className="w-32 h-32 text-cyan-luminous/20" />
                  </div>
                  <div className="relative z-10 text-center">
                    <div className="text-4xl mb-2">🌍</div>
                    <p className="text-blue-gray text-sm">
                      Mapa interativo com indicadores geopolíticos
                    </p>
                    <p className="text-blue-gray text-xs mt-2">
                      (Visualização completa em desenvolvimento)
                    </p>
                  </div>
                  {/* Glow effects simulando regiões */}
                  <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-cyan-luminous/20 rounded-full blur-xl animate-pulse" />
                  <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-electric-blue/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Rankings Estratégicos */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">
                <span className="text-gradient-cyan">Rankings Estratégicos</span>
              </h2>
              <p className="text-blue-gray">
                Índice de poder e influência global (atualizado em tempo real)
              </p>
            </div>

            <Card className="max-w-3xl mx-auto">
              <div className="space-y-4">
                {rankings.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-gradient-to-r from-cyan-luminous to-electric-blue text-space-blue' :
                        index === 1 ? 'bg-electric-blue/20 text-electric-blue' :
                        index === 2 ? 'bg-neon-green/20 text-neon-green' :
                        'bg-white/10 text-mist-gray'
                      }`}>
                        {item.position}
                      </div>
                      <div>
                        <div className="font-semibold text-mist-gray">
                          {item.country}
                        </div>
                        <div className="text-xs text-blue-gray">
                          Score: {item.score}
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${
                      item.change.startsWith('+') ? 'text-neon-green' : 'text-red-400'
                    }`}>
                      {item.change}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Moedas */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8 bg-graphite-cold/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 mb-2">
                <DollarSign className="w-6 h-6 text-cyan-luminous" />
                <h2 className="text-3xl font-bold">
                  <span className="text-gradient-cyan">Principais Moedas</span>
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { currency: 'USD/EUR', value: '0.92', change: '+0.1%' },
                { currency: 'USD/GBP', value: '0.79', change: '-0.2%' },
                { currency: 'USD/JPY', value: '149.50', change: '+0.3%' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className="text-center">
                    <div className="text-sm font-semibold text-blue-gray mb-2">
                      {item.currency}
                    </div>
                    <div className="text-2xl font-bold text-mist-gray mb-1">
                      {item.value}
                    </div>
                    <div className="text-sm font-semibold text-neon-green">
                      {item.change}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard

