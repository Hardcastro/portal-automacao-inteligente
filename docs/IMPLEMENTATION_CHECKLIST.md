## Auditoria rápida
- Não existe backend ativo ou entrypoint Express; o repositório contém apenas SPA React/Vite.
- Prisma já define modelos multi-tenant (tenants, api_keys, reports, automation_runs, outbox_events, idempotency_keys) e há seed que cria tenant `aetherflow-demo` + API key hash (`dev-portal-api-key` com pepper).
- Não há logger, middleware de requestId/correlationId ou autenticação; integração com ActivePieces ainda não está presente.
- Front consome `/v1/tenants/:tenantId/reports` (via env `VITE_REPORTS_API_URL`), mas não há implementação real.

## Checklist de implementação (ordem)
1. Config/env e logger: validar variáveis, requestId/correlationId, logs JSON e envelope de erros.
2. Autenticação por API key com escopos e enforcement de tenant + rate limiting por Redis.
3. Camada de idempotência (DB) para POST críticos (`reports`, `automation-runs`) com TTL.
4. Rotas HTTP `/v1`:
   - `POST /reports` (batch/upsert + outbox transacional) e `GET /reports`/`/latest`.
   - `POST /automation-runs` (enqueue BullMQ) e `GET /automation-runs/:id`.
5. Outbox worker: polling, retries 429/5xx com backoff e DLQ em BullMQ.
6. Fila BullMQ `automation` + worker de automação com retries/DLQ e correlationId.
7. Webhook callback ActivePieces: HMAC + anti-replay (Redis nonce), atualizando `automation_runs`.
8. OpenAPI 3.1 alinhado e documentação de deploy/arquitetura atualizadas (.env.example, docs).
9. Testes de integração mínimos: auth (401/403), idempotência (replay/conflict), reports CRUD básico e callback anti-replay.
