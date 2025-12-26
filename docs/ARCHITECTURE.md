# Arquitetura atual e rota de migracao

## Visao geral
O repositorio hoje tem dois trilhos:

1) **Backend atual (Node + Express)**: `apps/api` + `apps/worker` em Node.js ESM, com Prisma/Postgres, Redis/BullMQ, multi-tenant, idempotencia, filas/DLQ, webhook assinado e observabilidade.
2) **Trilho Azure (migracao)**: `apps/functions` + `infra/azure` para Azure Functions + Cosmos DB + Blob Storage + Storage Queue + Application Insights + Key Vault.

Objetivo: manter o contrato do Blog imutavel enquanto migramos gradualmente para Azure.

## Estado atual (implementado)
- **API v1** em `apps/api` com entrypoint `apps/api/server.ts` e rotas de reports, automations, webhooks e health.
- **Workers** em `apps/worker` para outbox e automations usando BullMQ.
- **Multi-tenant** via `/v1/tenants/:tenantId` com API key e escopos.
- **Idempotencia** para POST criticos e rate limiting via Redis.
- **Observabilidade**: `requestId`/`correlationId` e logs JSON.
- **Fallback dev/test**: Prisma/Redis/filas in-memory quando `USE_INMEMORY_STUBS=true`.
- **Front-end** React/Vite consumindo `REPORTS_API_URL` (default `/api/reports`) com fallback estatico (`/public/latest.json`).

## Rotas implementadas (API v1)
- `GET /health/healthz`
- `GET /health/readyz`
- `POST /v1/tenants/:tenantId/reports`
- `GET /v1/tenants/:tenantId/reports?limit&cursor`
- `GET /v1/tenants/:tenantId/reports/latest`
- `POST /v1/tenants/:tenantId/automation-runs`
- `GET /v1/tenants/:tenantId/automation-runs/:runId`
- `POST /v1/webhooks/activepieces/callback`

## Filas e workers
- **Filas**: `outbox`, `automation` + DLQ (`outbox:dlq`, `automation:dlq`).
- **Workers**: `outboxProcessor` e `automationProcessor`.
- **Dev/test**: filas em memoria com retries e backoff basicos.

## Layout do codigo (monorepo)
```
/            # repositorio raiz
├─ apps/
│  ├─ api/        # Web API Express (ESM, Zod, Pino)
│  ├─ worker/     # Workers BullMQ (outbox + automations)
│  └─ functions/  # Azure Functions (blog read + scheduler/worker)
├─ prisma/        # schema.prisma, migrations/, seed.js
├─ docs/          # arquitetura, contratos, runbooks, openapi (quando pronto)
└─ infra/         # Bicep para Azure
```

## Trilho Azure (migracao)
- **Functions HTTP (blog read)**: `GET /blog/posts` e `GET /blog/posts/{slug}`.
- **Queues + Timer**: `report-jobs` + worker para gerar posts; timer diario para enfileirar jobs.
- **Cosmos + Blob**: metadados em Cosmos, conteudo em Blob, `latest.json` materializado.
- **Infra**: Bicep em `infra/azure` com Storage, Cosmos, Functions, Insights e Key Vault.

## Pendencias criticas (alinhamento)
- Documentar a rota Azure como destino oficial para o Blog e manter o contrato imutavel.
- Corrigir sanitizacao de HTML no backend e/ou antes de salvar.
- Endurecer o middleware de arquivos estaticos contra path traversal e erros.
- Remover defaults inseguros de segredos (ex: `change-me`) fora de dev/test.
- Publicar OpenAPI e expandir cobertura de testes.
