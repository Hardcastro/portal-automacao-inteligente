# Portal Automação Inteligente

SPA em React/Vite para exibir relatórios estratégicos consumidos de uma API externa (`/api/reports`) com fallback para snapshots JSON e cache em `localStorage`. O projeto foi pensado para ser servido como site estático (Render, GitHub Pages, etc.) enquanto consulta um backend já provisionado.

## ✨ Principais recursos
- **Blog dinâmico**: carrega até 60 relatórios recentes via `getReports()` (API → fallback → exemplo local) e usa `localStorage` para acelerar navegações.
- **Fallback resiliente**: suporte a `latest.json` (objeto único) ou `reports.json` (lista completa), convertendo-os para arrays consumíveis pelo front-end.
- **Validação/normalização**: campos obrigatórios (id, slug, title, excerpt, category, date e `content` ou `contentUrl`) são normalizados no cliente, com autor padrão e marcação de itens recentes.
- **Cache-first no detalhe**: `getReportBySlug` reaproveita cache antes de buscar a API, garantindo leitura mesmo em cenários offline.
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
VITE_REPORTS_API_URL=https://<seu-backend>/api/reports
VITE_REPORTS_FALLBACK_URL=https://<seu-backend>/public/latest.json  # ou /public/reports.json
```

Se as variáveis não estiverem presentes, o app usa apenas cache prévio e `src/data/reports.example.json` como último recurso.
Em produção, confirme que `VITE_REPORTS_API_URL` aponta para o domínio público da API (ex.: `https://www.aetherflow.digital/api/reports`)
ou garanta que `/api/reports` esteja acessível a partir do host onde o front-end é servido, evitando cair em fallback.

Para implantações na AetherFlow, você pode copiar `.env.production.example` e ajustar conforme o domínio da API:

```
cp .env.production.example .env.production
# edite se o host da API for diferente
```

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

4) Servir SPA + API em Node
```bash
npm start
```
O servidor HTTP usa os arquivos já gerados em `dist/`, expõe `/api/reports`, `/api/reports/:slug` e publica snapshots em `/public/reports.json` e `/public/latest.json`.

5) Pré-visualizar o build (apenas front-end)
```bash
npm run preview
```

## 📦 Estrutura relevante
```
src/
├── api/getReports.js         # Fetch com fallback + cache
├── components/ReportCard.jsx # Card reutilizável da listagem
├── pages/Blog.jsx            # Lista e filtros de relatórios
├── pages/BlogPost.jsx        # Página de detalhe (HTML ou PDF)
├── utils/normalizeReport.js  # Normalização cliente
├── utils/validateReport.js   # Validação/cálculo de metadados
└── data/reports.example.json # Exemplo local
```

## 🌐 Contrato esperado da API
Endpoint `GET /api/reports?limit=60` deve retornar `{ reports: Report[], meta }`. Cada `Report` precisa de:
- Obrigatórios: `id` (uuid), `slug`, `title`, `excerpt`, `category`, `date`, e **`content` ou `contentUrl`**.
- Opcionais: `tags[]`, `readTime`, `thumbnail`, `author`, `metadata`, `pdfUrl` (normalizado para `contentUrl`).

O front converte respostas alternativas:
- Arrays diretos (`[report]`)
- Objetos `{ reports: [...] }`
- Snapshots `{ latest: {...} }`

## 📊 Fluxo de dados e cache
1. Busca em `VITE_REPORTS_API_URL` com limite recomendado (60).
2. Se falhar, tenta `VITE_REPORTS_FALLBACK_URL` (aceita `latest.json` ou `reports.json`).
3. Se ainda falhar, usa `reports.example.json`.
4. Resultados válidos são armazenados em `localStorage` para uso posterior e para pré-carregar slugs específicos.

## ✅ Boas práticas
- Mantenha as URLs de API e fallback acessíveis pela mesma origem do front para evitar CORS em desenvolvimento.
- Publique também um `reports.json` completo como fallback para garantir lista cheia quando a API estiver indisponível.
- Garanta que cada relatório tenha `excerpt` e `date` válidos para não ser descartado pelo validador do cliente.

## 📜 Licença
Projeto de uso interno. Consulte os responsáveis antes de redistribuir.
