# Guia de deploy (Render)

## Servicos previstos
- Web Service (API + workers no mesmo processo): Node.js ESM com rotas `/v1`. Porta 3000. Depende de Postgres + Redis.
- Postgres (Managed): banco principal do multi-tenant.
- Redis (Managed): filas BullMQ, rate limit e anti-replay de webhooks.

## Comandos de build e start (producao)
- Build: `npm ci && npm run prisma:generate && npm run build && npm run prisma:migrate:deploy`
- API start: `npm run start:api`

Em producao, nunca rodar `tsx`; sempre usar `dist/` + `node`.

## Variaveis de ambiente minimas
- `DATABASE_URL`
- `REDIS_URL`
- `PORT`
- `ACTIVEPIECES_WEBHOOK_BLOG_URL`
- `ACTIVEPIECES_CALLBACK_SIGNING_SECRET`
- `ACTIVEPIECES_SIGNING_SECRET` (se usar assinatura outbound)

## Operacao
- Migracoes: `npm run prisma:migrate:deploy` a cada release.
- Seeds: somente na primeira carga ou quando precisar repor credenciais.
- Health checks: `/healthz` e `/readyz`.

## Observacoes para plano gratuito
- O Render free nao permite criar Background Worker separado. Os workers BullMQ rodam no mesmo processo da API.
- O Web Service dorme apos inatividade; use um ping externo (ex.: UptimeRobot) para manter o servico ativo.
- Redis gratuito do Render nao e persistente; se quiser mais estabilidade, use um Redis externo gratuito (ex.: Upstash).
