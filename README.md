# Portal Automação Inteligente

SPA em React/Vite para exibir relatórios estratégicos servidos **sempre** pela API do backend (`/api/reports`). A aplicação privilegia a API como fonte única e pode usar um fallback estático configurável e cache em `localStorage` para resiliência.

## ✨ Principais recursos
- **Blog dinâmico**: carrega até 60 relatórios recentes via `reportsClient.getReports()` (API → fallback estático opcional → erro controlado) com cache em `localStorage`.
- **Detalhe unificado**: `getReportBySlug` sempre busca `GET /api/reports/:slug`, reutiliza cache e só cai para fallback estático quando a API está indisponível.
- **Normalização leve no front**: respeita o slug vindo da API e só ajusta excerpt, tags, tempo de leitura e categoria em `src/utils/reportSchema.js`, alinhados ao contrato do backend.
- **Backend com validação forte**: o webhook de publicação (`POST /api/reports`) valida e normaliza antes de persistir.
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
VITE_REPORTS_FALLBACK_URL=https://<seu-backend>/public/latest.json  # opcional
VITE_ENABLE_REPORTS_EXAMPLE=true                                    # opcional (somente dev)
```

O front sempre tenta a API. Se `VITE_REPORTS_FALLBACK_URL` estiver configurada, ela é usada apenas quando a API falhar. O exemplo local só é lido quando
`VITE_ENABLE_REPORTS_EXAMPLE` estiver definido (útil para desenvolvimento). Em produção, confirme que `VITE_REPORTS_API_URL` aponta para o domínio público
da API (ex.: `https://www.aetherflow.digital/api/reports`) ou garanta que `/api/reports` esteja acessível a partir do host onde o front-end é servido.

Para implantações na AetherFlow, você pode copiar `.env.production.example` e ajustar conforme o domínio da API:

```
cp .env.production.example .env.production
# edite se o host da API for diferente
```

No backend (Node), defina `REPORTS_SECRET_TOKEN` para autorizar publicações via `POST /api/reports`. Se precisar gerar um snapshot
estático em `public/reports.json` e `public/latest.json`, habilite `ENABLE_REPORTS_SNAPSHOT=true` (desabilitado por padrão para evitar
fontes de verdade duplicadas). Você pode ainda customizar o backend com:
- `PAYLOAD_LIMIT`: define o limite do `POST /api/reports` (padrão `2mb`)
- `REPORTS_DATA_DIR`: diretório onde `reports.json`/`legacy-reports.json` são escritos (padrão `./data`)
- `REPORTS_PUBLIC_DIR`: diretório de snapshots públicos (`./public` por padrão quando `ENABLE_REPORTS_SNAPSHOT=true`)
- `REPORTS_DIST_DIR`: diretório do build estático do front (padrão `./dist`)

Automação/Activepieces (backend-only — **não usar `VITE_*`**):
- `ACTIVEPIECES_WEBHOOK_BLOG_URL`: URL do webhook/trigger do flow.
- `ACTIVEPIECES_SIGNING_SECRET`: segredo para assinar chamadas com HMAC (`X-Signature`).
- `ACTIVEPIECES_TIMEOUT_MS`: timeout das chamadas (default `8000`).
- `ACTIVEPIECES_RETRY_MAX`: tentativas com backoff (default `3`).
- `ACTIVEPIECES_ALLOWED_HOSTNAMES`: allowlist de hostnames para evitar SSRF (default `api.activepieces.com`).
- `AUTOMATION_RATE_LIMIT_WINDOW_MS` / `AUTOMATION_RATE_LIMIT_MAX`: limites de requisições no endpoint de automação (default 60s/20 req).

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
O servidor HTTP usa os arquivos já gerados em `dist/`, expõe `/api/reports`, `/api/reports/:slug`, `/api/health` e pode publicar snapshots opcionais em `/public/reports.json` e `/public/latest.json` quando `ENABLE_REPORTS_SNAPSHOT=true`.

5) Pré-visualizar o build (apenas front-end)
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

Arquitetura detalhada em [`docs/BACKEND_ARCHITECTURE.md`](./docs/BACKEND_ARCHITECTURE.md).

## 🌐 Contrato esperado da API
Endpoint `GET /api/reports?limit=60` deve retornar `{ reports: Report[], meta }`. Cada `Report` precisa de:
- Obrigatórios: `id` (uuid), `slug`, `title`, `excerpt`, `category`, `date`, e **`content` ou `contentUrl`**.
- Opcionais: `tags[]`, `readTime`, `thumbnail`, `author`, `metadata`, `pdfUrl` (normalizado para `contentUrl`).

O front converte respostas alternativas:
- Arrays diretos (`[report]`)
- Objetos `{ reports: [...] }`
- Snapshots `{ latest: {...} }`

## 🔄 Fluxo de publicação e leitura
- Publicação: Activepieces chama `POST /api/reports` com `REPORTS_SECRET_TOKEN` (Bearer) para armazenar/atualizar relatórios.
- Leitura: o site consome apenas `GET /api/reports` e `GET /api/reports/:slug` como fonte primária.
- Fallback: `VITE_REPORTS_FALLBACK_URL` é usado somente quando a API falha; o exemplo local requer `VITE_ENABLE_REPORTS_EXAMPLE=true`.

## 📊 Fluxo de dados e cache
1. Busca primária em `VITE_REPORTS_API_URL` com limite recomendado (60).
2. Se falhar, tenta `VITE_REPORTS_FALLBACK_URL` (aceita `latest.json` ou `reports.json`).
3. O exemplo `reports.example.json` só é utilizado quando `VITE_ENABLE_REPORTS_EXAMPLE=true`.
4. Resultados válidos são armazenados em `localStorage` (TTL) para acelerar navegação e servir o detalhe (`/blog/:slug`).

## 🤖 Automations (Activepieces)
- Endpoint orquestrador: `POST /api/automation/blog` (rate limit 20/min por IP).
- Payload esperado: `{ reports: [...] }` (array opcional). O backend gera `correlationId`, assina o corpo e chama o webhook do Activepieces com `X-Signature`, `X-Timestamp`, `X-Nonce`, `X-Request-Id`.
- Resposta: `202 { ok: true, correlationId, requestId }` ou `503` se a integração não estiver configurada.
- O frontend **não** chama Activepieces diretamente; use o endpoint acima.
- Activepieces publica relatórios de volta via `POST /api/reports` com Bearer `REPORTS_SECRET_TOKEN`.

## ✅ Boas práticas
- Mantenha as URLs de API e fallback acessíveis pela mesma origem do front para evitar CORS em desenvolvimento.
- Publique também um `reports.json` completo como fallback para garantir lista cheia quando a API estiver indisponível.
- Garanta que cada relatório tenha `excerpt` e `date` válidos para não ser descartado pelo validador do cliente.

## 📜 Licença
Projeto de uso interno. Consulte os responsáveis antes de redistribuir.
