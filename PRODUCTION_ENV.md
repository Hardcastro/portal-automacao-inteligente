# Variáveis de Ambiente para Produção

## Token de Segurança Gerado

Para sua aplicação em produção, foi gerado um novo token secreto:

```
REPORTS_SECRET_TOKEN=b7429f76ab81f8b9d771987064bfe1c90a4138a7de65ba0442b01f62e36ad829
```

**⚠️ IMPORTANTE**: 
- Este token é sensível e deve ser mantido em segredo
- Não compartilhe este token publicamente
- Use este token apenas nas variáveis de ambiente da plataforma de hospedagem
- Não faça commit deste arquivo no Git

---

## Configuração Completa para Render.com

Quando criar o Web Service no Render, adicione estas variáveis de ambiente:

### Variáveis Obrigatórias

```bash
NODE_ENV=production
PORT=3000
REPORTS_SECRET_TOKEN=b7429f76ab81f8b9d771987064bfe1c90a4138a7de65ba0442b01f62e36ad829
ENABLE_REPORTS_SNAPSHOT=true
# Integração Activepieces (backend)
ACTIVEPIECES_WEBHOOK_BLOG_URL=https://api.activepieces.com/webhook/SEU_WEBHOOK_ID
ACTIVEPIECES_SIGNING_SECRET=defina-um-segredo-forte
ACTIVEPIECES_CALLBACK_SIGNING_SECRET=segredo-para-validar-callbacks
ACTIVEPIECES_TIMEOUT_MS=8000
ACTIVEPIECES_RETRY_MAX=3
ACTIVEPIECES_ALLOWED_HOSTNAMES=api.activepieces.com
# Idempotência e fila (opcionais)
REDIS_URL= # ex: redis://default:senha@host:6379
IDEMPOTENCY_TTL_MS=600000
QUEUE_DRIVER=bullmq # ou sqs|memory
QUEUE_PREFIX=pai
# Rate limit do endpoint de automação (opcional)
AUTOMATION_RATE_LIMIT_WINDOW_MS=60000
AUTOMATION_RATE_LIMIT_MAX=20
```

### Variáveis do Frontend (Atualizar após primeiro deploy)

**Primeira vez (para o build inicial funcionar):**
```bash
VITE_ENABLE_REPORTS_EXAMPLE=true
```

**Após obter a URL do Render (exemplo: `https://portal-automacao-inteligente.onrender.com`):**

Adicione estas variáveis e faça um novo deploy:

```bash
VITE_REPORTS_API_URL=https://portal-automacao-inteligente.onrender.com/api/reports
VITE_REPORTS_FALLBACK_URL=https://portal-automacao-inteligente.onrender.com/public/latest.json
```

**Nota**: Substitua `portal-automacao-inteligente` pela URL real que o Render atribuir ao seu app.

---

## Configuração do Webhook Activepieces

Após o deploy, configure o webhook no Activepieces:

### Endpoint
```
POST https://SEU-APP.onrender.com/api/reports
```

### Headers
```
Content-Type: application/json
Authorization: Bearer b7429f76ab81f8b9d771987064bfe1c90a4138a7de65ba0442b01f62e36ad829
```

### Payload de Exemplo
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "seu-relatorio-slug",
  "title": "Título do Relatório",
  "excerpt": "Resumo breve do relatório",
  "category": "geopolitica",
  "tags": ["tag1", "tag2"],
  "date": "2025-12-20T10:00:00Z",
  "content": {
    "type": "html",
    "body": "<h2>Conteúdo</h2><p>Seu conteúdo HTML aqui</p>"
  },
  "author": "Motor Inteligente"
}
```

---

## Teste de Publicação

Após o deploy, teste a publicação com curl:

```bash
curl -X POST https://SEU-APP.onrender.com/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer b7429f76ab81f8b9d771987064bfe1c90a4138a7de65ba0442b01f62e36ad829" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "teste-producao",
    "title": "Teste de Produção",
    "excerpt": "Primeiro relatório em produção",
    "category": "tendencias",
    "date": "2025-12-20T10:00:00Z",
    "content": {
      "type": "html",
      "body": "<h2>Sucesso!</h2><p>O site está no ar!</p>"
    }
  }'
```

Resposta esperada:
```json
{
  "message": "Relatórios armazenados com sucesso",
  "total": 1,
  "lastUpdated": "2025-12-20T..."
}
```

---

## Verificação

Após publicar um relatório, acesse:

1. **API direta**: `https://SEU-APP.onrender.com/api/reports`
2. **Blog**: `https://SEU-APP.onrender.com/blog`
3. **Relatório específico**: `https://SEU-APP.onrender.com/blog/teste-producao`

---

## Segurança

### ✅ Implementado
- Token de autenticação para publicação
- Headers de segurança HTTP
- Sanitização básica de HTML
- Validação de path traversal

### ⚠️ Recomendações Adicionais
1. Configurar CORS adequadamente (se expor a múltiplas origens)
2. Adicionar DOMPurify para sanitização robusta
3. Configurar backups automáticos

Consulte o arquivo `analise_defeitos.md` para detalhes completos sobre melhorias de segurança.
