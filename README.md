# Portal Automação Inteligente

SPA em React/Vite para exibir relatórios estratégicos servidos a partir de fontes externas configuráveis (`/api/reports`) ou snapshots estáticos. A aplicação privilegia a API como fonte única e pode usar um fallback estático configurável e cache em `localStorage` para resiliência.

## ✨ Principais recursos
- **Blog dinâmico**: carrega até 60 relatórios recentes via `reportsClient.getReports()` (API → fallback estático opcional → erro controlado) com cache em `localStorage`.
- **Detalhe unificado**: `getReportBySlug` sempre busca `GET /api/reports/:slug`, reutiliza cache e só cai para fallback estático quando a API está indisponível.
- **Normalização leve no front**: respeita o slug vindo da API e só ajusta excerpt, tags, tempo de leitura e categoria em `src/utils/reportSchema.js`, alinhados ao contrato de dados esperado.
- **UI consistente**: cards reutilizáveis com badges de categoria, indicador de fallback, tempo de leitura, autor e selo “novo” para publicações recentes.

## 🧰 Stack
- React 18 + Vite
- Tailwind CSS
- React Router
- Framer Motion
- Lucide React

## 🔧 Configuração de ambiente
Defina as variáveis em `.env` ou no provider de hosting antes do build:

```
VITE_REPORTS_API_URL=https://<sua-api>/api/reports
VITE_REPORTS_FALLBACK_URL=https://<seu-host>/public/latest.json  # opcional
VITE_ENABLE_REPORTS_EXAMPLE=true                                # opcional (somente dev)
```

O front sempre tenta a API. Se `VITE_REPORTS_FALLBACK_URL` estiver configurada, ela é usada apenas quando a API falhar. O exemplo local só é lido quando
`VITE_ENABLE_REPORTS_EXAMPLE` estiver definido (útil para desenvolvimento). Em produção, confirme que `VITE_REPORTS_API_URL` aponta para o domínio público
da API (ex.: `https://www.aetherflow.digital/api/reports`) ou garanta que `/api/reports` esteja acessível a partir do host onde o front-end é servido.

Para implantações na AetherFlow, você pode copiar `.env.production.example` e ajustar conforme o domínio da API:

```
cp .env.production.example .env.production
# edite se o host da API for diferente
```

O front sempre tenta a API. Se `VITE_REPORTS_FALLBACK_URL` estiver configurada, ela é usada apenas quando a API falhar. O exemplo local só é lido quando
`VITE_ENABLE_REPORTS_EXAMPLE` estiver definido (útil para desenvolvimento). Em produção, confirme que `VITE_REPORTS_API_URL` aponta para o domínio público
da API (ex.: `https://www.aetherflow.digital/api/reports`) ou garanta que `/api/reports` esteja acessível a partir do host onde o front-end é servido.

## 🚀 Como rodar
1) Instalar dependências
```bash
npm install
```

2) Ambiente de desenvolvimento (front-end)
```bash
npm run dev
```
Acesse http://localhost:5173

3) Build de produção do front-end
```bash
npm run build
```

4) Pré-visualizar o build (apenas front-end)
```bash
npm run preview
```

## 📦 Estrutura relevante
```
src/
├── api/reportsClient.js      # Fetch unificado com fallback + cache
├── components/ReportCard.jsx # Card reutilizável da listagem
├── pages/Blog.jsx            # Lista e filtros de relatórios
├── pages/BlogPost.jsx        # Página de detalhe (HTML ou Markdown)
├── utils/reportSchema.js     # Normalização cliente compartilhada
└── data/reports.example.json # Exemplo local
```

Arquitetura original orientada a backend não está mais incluída neste repositório; a UI pode ser servida como SPA estática ou atrás de qualquer API compatível.

## ✅ Boas práticas
- Mantenha as URLs de API e fallback acessíveis pela mesma origem do front para evitar CORS em desenvolvimento.
- Publique também um `reports.json` completo como fallback para garantir lista cheia quando a API estiver indisponível.
- Garanta que cada relatório tenha `excerpt` e `date` válidos para não ser descartado pelo validador do cliente.

## 📜 Licença
Projeto de uso interno. Consulte os responsáveis antes de redistribuir.
