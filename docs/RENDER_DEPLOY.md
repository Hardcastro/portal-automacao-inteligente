# Guia de deploy (Render)

## Serviços previstos
- **Web Service (API)**: Node.js ESM com rotas `/v1` (auth API key, idempotência, rate limit, logs JSON). Porta 3000. Depende de Postgres + Redis.
- **Background Worker**: Node.js ESM, consome `outbox_events` e fila de automação (DLQ dedicada). Compartilha o mesmo código/base.
- **Postgres (Managed)**: banco principal do multi-tenant.
- **Redis (Managed)**: filas BullMQ, rate limit e anti-replay de webhooks.

## Variáveis de ambiente (backend)
- `DATABASE_URL` – string de conexão Postgres (postgresql://user:pass@host:port/db).
- `REDIS_URL` – string de conexão Redis (redis://user:pass@host:port/0).
- `API_KEY_PEPPER` – pepper usado no hash das API keys (não versionar).
- `ACTIVEPIECES_WEBHOOK_BLOG_URL` – URL de entrega do outbox (blog/report webhook).
- `ACTIVEPIECES_SIGNING_SECRET` – opcional, para chamadas outbound assinadas.
- `ACTIVEPIECES_CALLBACK_SIGNING_SECRET` – segredo HMAC para validar callbacks ActivePieces.
- `ACTIVEPIECES_WEBHOOK_TIMEOUT_MS` – timeout das chamadas ActivePieces (ms).
- `IDP_TTL_HOURS` – tempo de retenção das chaves de idempotência.
- `CALLBACK_TIMESTAMP_SKEW_SECONDS` – janela de tolerância para callback anti-replay.
- `RATE_LIMIT_WINDOW_SECONDS`, `RATE_LIMIT_REPORTS_READ`, `RATE_LIMIT_REPORTS_WRITE`, `RATE_LIMIT_AUTOMATION`, `RATE_LIMIT_WEBHOOK` – limites por rota/tenant.
- `PORT` – porta HTTP do Web Service (padrão 3000).
- `NODE_ENV` – `production` em Render.

## Fluxo de provisionamento
1. Criar Postgres e Redis managed.
2. Definir variáveis acima nos dois serviços Node (Web e Worker). `API_KEY_PEPPER` deve ser igual em ambos.
3. Durante o primeiro deploy, executar (manual ou via hook) no Web Service:
   - `npm run db:migrate:deploy`
   - `npm run db:seed`
4. Confirmar logs do seed: um tenant `aetherflow-demo` e API key `dev-portal-api-key` (hash com pepper) são criados.
5. Configurar domínios e health checks (`/healthz`, `/readyz`) quando implementados.

## Front-end (Vite)
Variáveis `VITE_*` são públicas e podem apontar para o domínio do Web Service:
- `VITE_REPORTS_API_URL=https://<dominio-api>/v1/tenants/aetherflow-demo/reports`
- `VITE_REPORTS_FALLBACK_URL=https://<dominio-front>/public/latest.json` (opcional)
- `VITE_ACTIVEPIECES_WEBHOOK_BLOG=<url publica>` (quando aplicável)
- `VITE_ENABLE_REPORTS_EXAMPLE=false` em produção.

## Operação
- **Migrações**: `npm run db:migrate:deploy` a cada release.
- **Seeds**: somente na primeira carga ou quando precisar repor credenciais padrão.
- **Observabilidade**: logs estruturados (JSON) com `requestId`/`correlationId` e `tenantId`. Health-checks devem validar Postgres + Redis (`/readyz`).
