import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Tag, Zap } from 'lucide-react'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'

const Blog = () => {
  const [activeFilter, setActiveFilter] = useState('todos')

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'geopolitica', label: 'Geopolítica' },
    { id: 'macroeconomia', label: 'Macroeconomia' },
    { id: 'tendencias', label: 'Tendências' },
    { id: 'mercados', label: 'Mercados' },
  ]

  const posts = [
    {
      id: 1,
      title: 'Análise Geopolítica: Tensões no Oriente Médio',
      excerpt: 'Análise profunda das dinâmicas geopolíticas atuais e seus impactos globais.',
      category: 'geopolitica',
      date: '2024-01-15',
      readTime: '5 min',
    },
    {
      id: 2,
      title: 'Macroeconomia Global: Inflação e Taxas de Juros',
      excerpt: 'Panorama econômico mundial com foco em políticas monetárias e inflação.',
      category: 'macroeconomia',
      date: '2024-01-14',
      readTime: '7 min',
    },
    {
      id: 3,
      title: 'Tendências Tecnológicas 2024',
      excerpt: 'As principais tendências tecnológicas que moldarão o futuro próximo.',
      category: 'tendencias',
      date: '2024-01-13',
      readTime: '6 min',
    },
    {
      id: 4,
      title: 'Mercados Emergentes: Oportunidades e Riscos',
      excerpt: 'Análise detalhada dos mercados emergentes e suas perspectivas de crescimento.',
      category: 'mercados',
      date: '2024-01-12',
      readTime: '8 min',
    },
    {
      id: 5,
      title: 'Geopolítica Energética: Transição e Segurança',
      excerpt: 'Como a transição energética está redefinindo alianças geopolíticas globais.',
      category: 'geopolitica',
      date: '2024-01-11',
      readTime: '6 min',
    },
    {
      id: 6,
      title: 'Macroeconomia: Crescimento e Desenvolvimento',
      excerpt: 'Perspectivas de crescimento econômico global e desafios estruturais.',
      category: 'macroeconomia',
      date: '2024-01-10',
      readTime: '5 min',
    },
  ]

  const filteredPosts = activeFilter === 'todos' 
    ? posts 
    : posts.filter(post => post.category === activeFilter)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

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
              <span className="text-gradient-cyan">Blog Estratégico</span>
            </h1>
            <p className="text-xl text-blue-gray mb-8">
              Insights automatizados sobre geopolítica, macroeconomia, tendências e mercados.
            </p>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-luminous/10 rounded-full">
              <Zap className="w-4 h-4 text-cyan-luminous" />
              <span className="text-sm text-cyan-luminous font-semibold">
                Gerado pelo Motor Inteligente
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filtros */}
      <section className="relative py-8 px-4 sm:px-6 lg:px-8 bg-graphite-cold/30">
        <div className="section-container">
          <div className="flex flex-wrap justify-center gap-3">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  activeFilter === filter.id
                    ? 'bg-cyan-luminous text-space-blue glow-cyan'
                    : 'bg-white/5 text-blue-gray hover:bg-white/10 hover:text-mist-gray'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid de Posts */}
      <section className="section-shell">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="h-full flex flex-col">
                  {/* Capa Minimalista */}
                  <div className="h-48 bg-gradient-to-br from-cyan-luminous/20 to-electric-blue/20 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-4xl opacity-50">
                      {post.category === 'geopolitica' && '🌍'}
                      {post.category === 'macroeconomia' && '📊'}
                      {post.category === 'tendencias' && '🚀'}
                      {post.category === 'mercados' && '💹'}
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="mb-3">
                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-cyan-luminous/10 text-cyan-luminous text-xs font-semibold rounded">
                      <Zap className="w-3 h-3" />
                      <span>Gerado pelo Motor</span>
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <h2 className="text-xl font-bold text-mist-gray mb-3 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-blue-gray text-sm mb-4 flex-grow line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-blue-gray pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(post.date)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Tag className="w-3 h-3" />
                      <span className="capitalize">{post.category}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      Ler mais
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-blue-gray text-lg">
                Nenhum post encontrado nesta categoria.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Paginação */}
      <section className="relative py-8 px-4 sm:px-6 lg:px-8">
        <div className="section-container">
          <div className="flex justify-center space-x-2">
            <Button variant="secondary" size="sm">Anterior</Button>
            <Button variant="primary" size="sm">1</Button>
            <Button variant="secondary" size="sm">2</Button>
            <Button variant="secondary" size="sm">3</Button>
            <Button variant="secondary" size="sm">Próxima</Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Blog

