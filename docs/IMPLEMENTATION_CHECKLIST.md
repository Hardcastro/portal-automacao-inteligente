# Implementation checklist (status atual)

## Estado atual (confirmado no repo)
- [x] API v1 com reports, automation runs, webhooks e health checks.
- [x] Auth por API key + escopos + enforcement de tenant.
- [x] Idempotencia para POST criticos (reports, automation-runs).
- [x] Rate limiting via Redis.
- [x] Outbox + automation workers (BullMQ) com DLQ.
- [x] Stubs in-memory para dev/test (`USE_INMEMORY_STUBS=true`).
- [x] Contrato do Blog: spec + fixtures + testes de schema/snapshot.
- [x] Azure Functions base (read API + queue worker + timer).
- [x] IaC Bicep + runbooks/cutover docs.

## Divida tecnica / correcoes pendentes
- [ ] Sanitizacao de HTML server-side (summary/body) e revisao no front.
- [ ] Middleware de arquivos estaticos: normalizar/decodificar path, tratar erros e adicionar testes.
- [ ] Segredos ActivePieces: remover defaults "change-me" fora de dev/test.
- [ ] Fallback data: deprecar `/public/latest.json` como fonte de verdade quando Cosmos for oficial.
- [ ] OpenAPI versionado e publicado.
- [ ] Endpoints faltantes (PUT/PATCH/DELETE reports) se o roadmap exigir.
- [ ] Multi-tenant: roles/permissoes alem de escopos.
- [ ] CORS restrito e endpoints internos protegidos.
- [ ] Alertas/metricas cloud (DLQ > 0, queue depth, falhas).

## Migracao Azure (proximos passos tecnicos)
- [ ] Aplicar Bicep em dev/prod e validar Cosmos/Blob/Queue/Insights.
- [ ] Confirmar Managed Identity + RBAC funcionando.
- [ ] Configurar Logic Apps se preferir agendamento fora do Timer.
- [ ] Capturar snapshots reais do contrato (script `scripts/capture-blog-contract.mjs`).
- [ ] Cutover gradual usando `VITE_REPORTS_API_URL` + rollback rapido.
