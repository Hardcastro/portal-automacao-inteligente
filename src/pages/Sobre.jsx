import { motion } from 'framer-motion'
import { Zap, Brain, Target, Rocket, Globe } from 'lucide-react'
import Card from '../components/UI/Card'

const Sobre = () => {
  const pillars = [
    {
      icon: <Zap className="w-12 h-12" />,
      title: 'Tecnologia',
      description: 'Utilizamos as tecnologias mais avançadas em IA, automação e processamento de dados para criar soluções que realmente funcionam.',
      color: 'cyan',
    },
    {
      icon: <Target className="w-12 h-12" />,
      title: 'Estratégia',
      description: 'Cada automação é pensada estrategicamente para entregar valor real e resultados mensuráveis para nossos clientes.',
      color: 'blue',
    },
    {
      icon: <Brain className="w-12 h-12" />,
      title: 'Automação',
      description: 'Sistemas que trabalham sozinhos, tomam decisões inteligentes e executam tarefas complexas sem intervenção humana.',
      color: 'cyan',
    },
    {
      icon: <Rocket className="w-12 h-12" />,
      title: 'IA Contextual',
      description: 'Modelos de IA que entendem contexto, nuances e tomam decisões baseadas em dados e experiência acumulada.',
      color: 'green',
    },
    {
      icon: <Globe className="w-12 h-12" />,
      title: 'Análise Global',
      description: 'Visão estratégica global que conecta dados, tendências e insights para criar análises profundas e acionáveis.',
      color: 'blue',
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
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-8">
              <span className="text-gradient-cyan">Manifesto</span>
            </h1>
            <p className="text-2xl sm:text-3xl text-blue-gray leading-relaxed">
              A união entre tecnologia, estratégia, automação, IA contextual e análise global.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Visão Geral */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-graphite-cold/30">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card glow className="p-12">
              <div className="prose prose-invert max-w-none">
                <p className="text-xl sm:text-2xl text-mist-gray leading-relaxed mb-6">
                  Acreditamos que a automação inteligente não é apenas sobre fazer tarefas mais rápido. 
                  É sobre criar sistemas que pensam, aprendem e evoluem.
                </p>
                <p className="text-lg sm:text-xl text-blue-gray leading-relaxed mb-6">
                  Nossa missão é transformar processos complexos em operações autônomas que geram valor 
                  contínuo, liberando pessoas para focar no que realmente importa: estratégia, inovação e crescimento.
                </p>
                <p className="text-lg sm:text-xl text-blue-gray leading-relaxed">
                  Cada solução que criamos é uma prova de que a tecnologia, quando bem aplicada, 
                  pode revolucionar a forma como trabalhamos e tomamos decisões.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Pilares */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-gradient-cyan">Nossos Pilares</span>
            </h2>
            <p className="text-xl text-blue-gray max-w-3xl mx-auto">
              Os fundamentos que guiam tudo o que fazemos
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pillars.map((pillar, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card
                  className={`h-full border-2 ${
                    pillar.color === 'cyan' ? 'border-cyan-luminous glow-cyan' :
                    pillar.color === 'blue' ? 'border-electric-blue glow-blue' :
                    'border-neon-green glow-green'
                  }`}
                >
                  <div className={`mb-6 ${
                    pillar.color === 'cyan' ? 'text-cyan-luminous' :
                    pillar.color === 'blue' ? 'text-electric-blue' :
                    'text-neon-green'
                  }`}>
                    {pillar.icon}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-mist-gray mb-4">
                    {pillar.title}
                  </h3>
                  <p className="text-blue-gray text-lg leading-relaxed">
                    {pillar.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Filosofia */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-graphite-cold/30">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-12">
              <span className="text-gradient-cyan">Nossa Filosofia</span>
            </h2>
            
            <div className="space-y-8 text-left">
              <Card>
                <h3 className="text-2xl font-bold text-mist-gray mb-4">
                  Automação com Inteligência
                </h3>
                <p className="text-lg text-blue-gray leading-relaxed">
                  Não automatizamos apenas tarefas repetitivas. Criamos sistemas que entendem contexto, 
                  tomam decisões e se adaptam a situações novas. É a diferença entre um robô e um assistente inteligente.
                </p>
              </Card>

              <Card>
                <h3 className="text-2xl font-bold text-mist-gray mb-4">
                  Valor Real, Resultados Mensuráveis
                </h3>
                <p className="text-lg text-blue-gray leading-relaxed">
                  Cada solução que desenvolvemos é pensada para entregar valor real e resultados que podem ser medidos. 
                  Não fazemos automação por fazer — fazemos porque gera impacto positivo.
                </p>
              </Card>

              <Card>
                <h3 className="text-2xl font-bold text-mist-gray mb-4">
                  Transparência e Confiança
                </h3>
                <p className="text-lg text-blue-gray leading-relaxed">
                  Acreditamos em sistemas transparentes, onde você entende como tudo funciona. 
                  A confiança vem da compreensão, e a compreensão vem da transparência.
                </p>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              <span className="text-gradient-cyan">Pronto para Transformar?</span>
            </h2>
            <p className="text-xl text-blue-gray mb-8 leading-relaxed">
              Se você acredita que a automação inteligente pode revolucionar seus processos, 
              estamos prontos para fazer isso acontecer.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Sobre

