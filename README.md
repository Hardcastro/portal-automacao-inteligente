# Portal de Automação Inteligente

Portal moderno e imersivo focado em automação inteligente, com design tecnológico profundo e 8 páginas completas.

## 🚀 Tecnologias

- **React 18** - Framework frontend
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização utilitária
- **Framer Motion** - Animações fluidas
- **React Router** - Roteamento
- **Lucide React** - Ícones modernos

## 🎨 Design

### Paleta de Cores

- **Fundo**: Azul Escuro Espacial (#0A0F1F), Grafite Frio (#12151C)
- **Destaques**: Ciano Luminoso (#00E5FF), Azul Elétrico (#1E90FF)
- **Tipografia**: Cinza Nevoado (#D9E2EC), Cinza Azulado (#A1AFC1)
- **Premium**: Aço Inoxidável (#C0C7D1), Verde Neônico Suave (#7CFFB2)

### Características Visuais

- Design imersivo com profundidade tridimensional
- Efeitos de glow (brilho) em elementos importantes
- Animações sutis e transições suaves
- Glassmorphism (efeito de vidro) em componentes
- Partículas animadas em backgrounds
- Responsivo e mobile-first

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.jsx      # Navegação principal
│   │   ├── Footer.jsx      # Rodapé
│   │   └── PageContainer.jsx
│   └── UI/
│       ├── Button.jsx      # Botões com variantes
│       ├── Card.jsx        # Cards com efeitos
│       ├── GlowEffect.jsx  # Efeitos de brilho
│       ├── ParticleBackground.jsx  # Partículas animadas
│       └── PipelineVisualization.jsx  # Visualização de pipelines
├── pages/
│   ├── Home.jsx            # Página inicial
│   ├── Automacao.jsx       # Automação Inteligente
│   ├── Blog.jsx            # Blog Estratégico
│   ├── Dashboard.jsx       # Dashboard Estratégico
│   ├── ComoAutomatizamos.jsx  # Case study
│   ├── Sobre.jsx           # Manifesto/Sobre
│   ├── Contato.jsx        # Contato/WhatsApp
│   └── Cliente.jsx        # Área do Cliente (placeholder)
├── styles/
│   └── globals.css        # Estilos globais e utilitários
├── App.jsx                # Router principal
└── main.jsx               # Entry point
```

## 🛠️ Instalação

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse no navegador:
```
http://localhost:5173
```

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão em `dist/`.

## 🎯 Páginas

1. **Home** (`/`) - Hero imersivo, motor inteligente, casos de uso
2. **Automação** (`/automacao`) - Explicação visual, motor IA, demonstração
3. **Blog** (`/blog`) - Grid de posts com filtros
4. **Dashboard** (`/dashboard`) - Indicadores estratégicos em tempo real
5. **Como Automatizamos** (`/como-automatizamos`) - Case study visual
6. **Sobre** (`/sobre`) - Manifesto e filosofia
7. **Contato** (`/contato`) - CTA WhatsApp e formulário
8. **Cliente** (`/cliente`) - Área restrita (em desenvolvimento)

## 🔧 Configuração

### Personalizar Cores

Edite `tailwind.config.js` para ajustar a paleta de cores.

### Adicionar Animações

Animações customizadas podem ser adicionadas em `tailwind.config.js` (keyframes) ou `src/styles/globals.css`.

## 📝 Próximos Passos

- [ ] Integração com backend para dashboard real-time
- [ ] Integração WhatsApp (WAHA + n8n)
- [ ] Sistema de autenticação para área do cliente
- [ ] CMS para blog automatizado
- [ ] Otimizações de performance
- [ ] Testes automatizados

## 📄 Licença

Este projeto é privado e proprietário.

