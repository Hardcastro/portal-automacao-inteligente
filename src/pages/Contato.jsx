import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Mail, Phone, ArrowRight, Send } from 'lucide-react'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'

const Contato = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Aqui você pode adicionar a lógica de envio do formulário
    console.log('Form submitted:', formData)
    alert('Mensagem enviada! Em breve entraremos em contato.')
    setFormData({ name: '', email: '', message: '' })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

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
              <span className="text-gradient-cyan">Teste Nossa Automação Agora Mesmo</span>
            </h1>
            <p className="text-xl text-blue-gray mb-8">
              Converse com o IA-Attendant no WhatsApp e experimente o poder da automação inteligente.
            </p>
            <Button
              size="lg"
              href="https://wa.me/5511999999999"
              target="_blank"
              className="group"
            >
              <MessageSquare className="mr-2 w-5 h-5" />
              Abrir IA-Attendant no WhatsApp
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA Principal */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8 bg-graphite-cold/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card glow className="max-w-3xl mx-auto text-center p-8">
              <MessageSquare className="w-16 h-16 text-cyan-luminous mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-mist-gray mb-4">
                Experimente a Automação Inteligente
              </h2>
              <p className="text-lg text-blue-gray mb-6">
                O IA-Attendant é um assistente virtual avançado que:
              </p>
              <ul className="text-left space-y-3 mb-8 max-w-md mx-auto">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-cyan-luminous rounded-full mr-3 mt-2 flex-shrink-0" />
                  <span className="text-blue-gray">Faz triagem inicial inteligente</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-cyan-luminous rounded-full mr-3 mt-2 flex-shrink-0" />
                  <span className="text-blue-gray">Coleta informações relevantes</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-cyan-luminous rounded-full mr-3 mt-2 flex-shrink-0" />
                  <span className="text-blue-gray">Direciona para a solução ideal</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-cyan-luminous rounded-full mr-3 mt-2 flex-shrink-0" />
                  <span className="text-blue-gray">Funciona 24 horas por dia, 7 dias por semana</span>
                </li>
              </ul>
              <Button
                size="lg"
                href="https://wa.me/5511999999999"
                target="_blank"
                className="group"
              >
                <MessageSquare className="mr-2 w-5 h-5" />
                Iniciar Conversa Agora
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Formulário de Contato */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-gradient-cyan">Ou Envie uma Mensagem</span>
            </h2>
            <p className="text-blue-gray text-lg">
              Prefere enviar um e-mail? Preencha o formulário abaixo.
            </p>
          </motion.div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-mist-gray mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-mist-gray focus:outline-none focus:border-cyan-luminous focus:glow-cyan transition-all"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-mist-gray mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-mist-gray focus:outline-none focus:border-cyan-luminous focus:glow-cyan transition-all"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-mist-gray mb-2">
                  Mensagem
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-mist-gray focus:outline-none focus:border-cyan-luminous focus:glow-cyan transition-all resize-none"
                  placeholder="Conte-nos sobre seu projeto ou dúvida..."
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full group"
              >
                <Send className="mr-2 w-5 h-5" />
                Enviar Mensagem
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Informações de Contato */}
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
              <span className="text-gradient-cyan">Outras Formas de Contato</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center">
              <MessageSquare className="w-10 h-10 text-cyan-luminous mx-auto mb-4" />
              <h3 className="text-xl font-bold text-mist-gray mb-2">WhatsApp</h3>
              <p className="text-blue-gray mb-4">Fale com o IA-Attendant</p>
              <Button
                variant="outline"
                size="sm"
                href="https://wa.me/5511999999999"
                target="_blank"
              >
                Abrir WhatsApp
              </Button>
            </Card>

            <Card className="text-center">
              <Mail className="w-10 h-10 text-cyan-luminous mx-auto mb-4" />
              <h3 className="text-xl font-bold text-mist-gray mb-2">E-mail</h3>
              <p className="text-blue-gray mb-4">contato@automacaoia.com</p>
              <Button
                variant="outline"
                size="sm"
                href="mailto:contato@automacaoia.com"
              >
                Enviar E-mail
              </Button>
            </Card>

            <Card className="text-center">
              <Phone className="w-10 h-10 text-cyan-luminous mx-auto mb-4" />
              <h3 className="text-xl font-bold text-mist-gray mb-2">Telefone</h3>
              <p className="text-blue-gray mb-4">+55 11 99999-9999</p>
              <Button
                variant="outline"
                size="sm"
                href="tel:+5511999999999"
              >
                Ligar Agora
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contato

