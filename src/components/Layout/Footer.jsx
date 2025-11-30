import { Link } from 'react-router-dom'
import { Zap, MessageCircle } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-graphite-cold/50 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-cyan-luminous" />
              <span className="text-xl font-bold text-gradient-cyan">
                Automação IA
              </span>
            </Link>
            <p className="text-blue-gray text-sm">
              Transformamos processos complexos em sistemas inteligentes que trabalham sozinhos.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-mist-gray font-semibold mb-4">Navegação</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/automacao" className="text-blue-gray hover:text-cyan-luminous transition-colors text-sm">
                  Automação Inteligente
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-blue-gray hover:text-cyan-luminous transition-colors text-sm">
                  Blog Estratégico
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-blue-gray hover:text-cyan-luminous transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-blue-gray hover:text-cyan-luminous transition-colors text-sm">
                  Sobre Nós
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-mist-gray font-semibold mb-4">Contato</h3>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-cyan-luminous hover:text-electric-blue transition-colors text-sm"
            >
              <MessageCircle size={18} />
              <span>Fale com o IA-Attendant</span>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <p className="text-blue-gray text-sm">
            © {currentYear} Automação Inteligente. Todos os direitos reservados.
          </p>
          <p className="text-blue-gray text-xs mt-2">
            Desenvolvido com automação inteligente
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

