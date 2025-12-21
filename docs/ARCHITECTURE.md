# Arquitetura alvo (MVP robusto)

## Visão geral
O objetivo é reconstruir o backend do aetherflow.digital com um Web API e um Worker Node.js (ESM) conectados a Postgres + Prisma e Redis (BullMQ), suportando multi-tenant, idempotência, filas/DLQ, webhooks assinados e observabilidade estruturada.

- **Serviços (Render):** Web API (Express) + Worker (BullMQ) + Postgres (managed) + Redis (managed).
- **Linguagem/stack:** Node.js ESM, Express, Prisma, BullMQ, Zod, Pino JSON.
- **Multi-tenant:** `tenantId` sempre vindo do path `/v1/tenants/:tenantId`, com enforcement via API Key.
- **Contratos v1:** reports (POST batch, GET list/latest), automation runs (POST, GET by id), webhooks callbacks, health/ready.

## Auditoria do repositório (estado atual)
- **Front-end SPA** em React/Vite (`npm run dev|build|start`) servindo dados de `/api/reports` ou fallback estático (`src/api/reportsClient.js`).
- **Não há backend ativo**: nenhum entrypoint Node/Express, filas BullMQ ou camada de idempotência presentes.
- **Dados**: somente JSON estáticos em `public/`/`src/data/`. Nenhuma integração com Postgres/Redis.
- **Autenticação/autorização**: inexistente. Chaves e tokens em `.env` eram apenas placeholders legados.
- **Testes**: `npm test` cobre apenas validação/normalização de relatórios no front (`tests/validateReport.test.js`).

## Layout pretendido do código
```
/            # repositório raiz (monorepo simples)
├─ apps/
│  ├─ api/      # Web API Express (ESM, Zod, Pino)
│  └─ worker/   # Workers BullMQ (outbox + automations)
├─ prisma/      # schema.prisma, migrations/, seed.js
└─ docs/        # ARCHITECTURE, RENDER_DEPLOY, openapi.yaml (quando pronto)
```

Componentes transversais planejados:
- **Config**: carregamento de env (DATABASE_URL, REDIS_URL, API_KEY_PEPPER, ACTIVEPIECES_* etc.) e validação.
- **Logger**: Pino JSON com `requestId`/`correlationId` e `tenantId`.
- **Erros**: envelope único de erro + middlewares para 4xx/5xx.
- **Idempotência**: middleware para POST `/reports` e `/automation-runs` com persistência em `idempotency_keys`.
- **Segurança**: API Key Bearer (hash+pepper) com escopos mínimos; webhook HMAC + anti-replay (Redis nonce + janela de tempo).

## Plano de execução (incremental)
1) **Auditoria** (feito aqui): mapear entrypoints e lacunas. Formalizar plano em `docs/ARCHITECTURE.md`.
2) **Infra básica**: adicionar Prisma + migrations iniciais + seed (tenant + api_key). Variáveis `DATABASE_URL`/`REDIS_URL` documentadas.
3) **Auth + tenants**: middleware Bearer, validação de escopos, envelope de erros consistente, requestId/correlationId nos logs.
4) **Idempotência**: camada DB + middleware para POST críticos; detecção de payload divergente (409) e replay seguro.
5) **Reports**: rotas batch/upsert + outbox em transação; paginação e `latest`.
6) **Outbox worker**: BullMQ consumindo `outbox_events`, retries 429/5xx com backoff e DLQ.
7) **Automation runs**: API + fila; worker aciona ActivePieces, persiste provider_run_id, retries controlados.
8) **Webhook callback**: verificação de assinatura HMAC, anti-replay via Redis, atualização de `automation_runs`.
9) **Rate limit**: Redis por tenant/rota, resposta 429 com `Retry-After`.
10) **OpenAPI + docs**: `docs/openapi.yaml`, `docs/RENDER_DEPLOY.md` completo, runbook e testes de integração.

## Modelo de dados mínimo (Prisma/Postgres)
- **tenants**: base multi-tenant (id UUID, slug único, name, timestamps).
- **api_keys**: `tenant_id`, `name`, `scopes[]`, `key_hash`, `status`, `last_used_at`.
- **reports**: `tenant_id`, `slug` (único por tenant), `title`, `summary`, `content` JSON, `published_at`, timestamps.
- **automation_runs**: `tenant_id`, `correlation_id` único, `status`, `input`/`output` JSON, `provider`, `provider_run_id`, timestamps.
- **outbox_events**: `tenant_id`, `type`, `payload` JSON, `status`, `attempts`, `next_retry_at`, `last_error`, timestamps.
- **idempotency_keys**: `tenant_id`, `key`, `method`, `path`, `request_hash`, `response_json`, `status_code`, `expires_at`, timestamps.

## Próximos passos imediatos
- Finalizar a camada Prisma com migrations + seed controlado.
- Criar base de env (`.env.example`) com DATABASE_URL/REDIS_URL/API_KEY_PEPPER e VITE_* públicos.
- Preparar scripts `npm run db:migrate:deploy` e `npm run db:seed` para os ambientes Render/local.
