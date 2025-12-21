# Guia de deploy (Render)

## Serviços previstos
- **Web Service (API)**: Node.js ESM, Express. Porta 3000. Depende de Postgres + Redis.
- **Background Worker**: Node.js ESM, executa filas BullMQ (automation + outbox). Compartilha o mesmo código/base.
- **Postgres (Managed)**: banco principal do multi-tenant.
- **Redis (Managed)**: filas BullMQ, rate limit e anti-replay de webhooks.

## Variáveis de ambiente (backend)
- `DATABASE_URL` – string de conexão Postgres (postgresql://user:pass@host:port/db).
- `REDIS_URL` – string de conexão Redis (redis://user:pass@host:port/0).
- `API_KEY_PEPPER` – pepper usado no hash das API keys (não versionar).
- `ACTIVEPIECES_WEBHOOK_URL` – URL do webhook ActivePieces para outbox (futuro).
- `ACTIVEPIECES_API_KEY` – token seguro para chamadas do worker (futuro).
- `WEBHOOK_SIGNATURE_SECRET` – segredo HMAC para callbacks assinados (futuro).
- `WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS` – janela de tempo permitida (ex.: 300).
- `WEBHOOK_NONCE_TTL_SECONDS` – TTL para nonce anti-replay (ex.: 900).
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
- **Observabilidade**: logs estruturados via Pino (adicionar nos próximos passos). Health-checks devem validar Postgres + Redis (`/readyz`).
