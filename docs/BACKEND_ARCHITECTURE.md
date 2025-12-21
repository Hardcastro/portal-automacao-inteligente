# Backend Architecture

## Camadas

- **Entrypoint**: `server.js` apenas inicializa o store (`initStore`) e sobe o HTTP server com `createApp`.
- **Configuração**: `src/server/config.js` centraliza env vars (porta, limites de payload, diretórios, Activepieces, rate limit).
- **HTTP / Express**: `src/server/app.js` aplica middlewares globais (Request-ID, logs, JSON parser, headers de segurança) e registra rotas em `src/server/http/routes`.
- **Middlewares**: `src/server/http/middlewares/*` contém segurança (`securityHeaders`), autenticação bearer (`createRequireAuth`), `requireJsonContent`, rate limit, Request-ID e logging.
- **Domínio**: regras de negócio ficam em `src/domain/*`.
  - `reports`: validação/normalização (`src/utils/serverReportUtils.js`), publicação com idempotência em memória e leitura via `reportService`.
  - `automation`: orquestração com Activepieces via `automationService`.
- **Integrações**: `src/integrations/activepieces/*`
  - `activepiecesSigner.js`: HMAC SHA256 (`X-Signature`) com `timestamp` + `nonce` + `rawBody`.
  - `activepiecesClient.js`: HTTP client com timeout, retries exponenciais e allowlist de hostnames.
  - `activepiecesMapper.js`: mapeia payloads do domínio para o fluxo do Activepieces.
- **Persistência**: `data/reportsData.js` continua sendo a fonte de verdade local (JSON + snapshots públicos opcionais).

## Contratos HTTP

### Relatórios (inalterados)
- `GET /api/reports?limit=` — lista com clamp de limite (1-200). Resposta inclui `reports`, `meta.total`, `meta.lastUpdated`, `requestId`.
- `GET /api/reports/:slug` — detalhe ou `404`.
- `POST /api/reports` — protegido por `Authorization: Bearer <REPORTS_SECRET_TOKEN>` e `Content-Type: application/json`.
  - Aceita objeto ou array de relatórios (payload idempotente opcional via `Idempotency-Key`).
  - Resposta `201` com `{ message, total, lastUpdated, requestId }`.

### Saúde
- `GET /api/health` — status do store e paths configurados, inclui `requestId`.

### Automação (Activepieces)
- `POST /api/automation/blog`
  - Rate limit padrão: 20 req/min por IP.
  - Corpo esperado: `{ reports: [...] }` (array opcional).
  - Orquestra chama o webhook do Activepieces com headers assinados (`X-Signature`, `X-Timestamp`, `X-Nonce`, `X-Request-Id`).
  - Resposta `202` `{ ok: true, correlationId, requestId }` ou `503` se não configurado.

### Estático
- `dist/` servido como SPA, com fallback para `index.html`.
- Snapshots públicos (`reports.json`, `latest.json`, `/public/*`) respeitam proteção de path traversal.

## Variáveis de Ambiente

### Core
- `PORT` — porta HTTP (default `3000`).
- `PAYLOAD_LIMIT` — limite do `express.json` (default `2mb`).
- `REPORTS_SECRET_TOKEN` — token Bearer do POST `/api/reports`.
- `REPORTS_DATA_DIR`, `REPORTS_PUBLIC_DIR`, `REPORTS_DIST_DIR` — caminhos (aceita relativos ao projeto).
- `ENABLE_REPORTS_SNAPSHOT` — `true` para publicar snapshots em `public/`.

### Activepieces (backend-only)
- `ACTIVEPIECES_WEBHOOK_BLOG_URL` — URL do webhook/trigger.
- `ACTIVEPIECES_SIGNING_SECRET` — segredo HMAC para `X-Signature`.
- `ACTIVEPIECES_TIMEOUT_MS` — timeout das chamadas (default `8000`).
- `ACTIVEPIECES_RETRY_MAX` — tentativas com backoff (default `3`).
- `ACTIVEPIECES_ALLOWED_HOSTNAMES` — allowlist de hostnames (default `api.activepieces.com`).

### Rate Limit
- `AUTOMATION_RATE_LIMIT_WINDOW_MS` — janela em ms (default `60000`).
- `AUTOMATION_RATE_LIMIT_MAX` — requisições por janela (default `20`).

### Frontend (público)
- `VITE_REPORTS_API_URL`, `VITE_REPORTS_FALLBACK_URL`, `VITE_ENABLE_REPORTS_EXAMPLE` — URLs públicas. **Não** expor segredos do Activepieces em variáveis `VITE_*`.

## Fluxo Activepieces ↔ Backend

1. **Frontend** nunca chama Activepieces diretamente; apenas `POST /api/automation/blog`.
2. **Backend → Activepieces**:
   - Gera `correlationId` (UUID) e `requestId` (middleware).
   - Monta payload via `activepiecesMapper`.
   - Assina `rawBody` com `activepiecesSigner` (`HMAC_SHA256(secret, \`\${timestamp}.\${nonce}.\${rawBody}\`)`).
   - Envia HTTP POST com timeout + retries exponenciais, allowlist de host.
3. **Activepieces → Backend**:
   - Continua usando `POST /api/reports` com Bearer token.
   - Payload passa por normalização/validação em `reportService` + `reportsData`.

## Segurança e Resiliência

- **Assinatura/HMAC** para evitar adulteração na chamada ao Activepieces.
- **Anti-replay**: `X-Timestamp` + `X-Nonce` no cabeçalho assinado.
- **SSRF guard**: client valida protocolo `http/https` e hostname allowlist.
- **Rate limit** no endpoint de automação.
- **Idempotência**: `Idempotency-Key` aceita no `POST /api/reports` (cache em memória com TTL).
- **Observabilidade**: `X-Request-Id` propagado em requisições e logs estruturados com latência.
