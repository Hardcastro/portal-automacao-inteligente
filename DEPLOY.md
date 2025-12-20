# Guia de Deploy - Portal Automação Inteligente

## Opção 1: Deploy no Render.com (Recomendado)

O Render.com oferece hospedagem gratuita para aplicações Node.js com deploy automático do GitHub.

### Passo a Passo

#### 1. Preparar o Repositório

O projeto já está configurado com o arquivo `render.yaml` que automatiza o deploy.

#### 2. Criar Conta no Render

1. Acesse [render.com](https://render.com)
2. Clique em "Get Started for Free"
3. Faça login com sua conta do GitHub

#### 3. Criar Novo Web Service

1. No dashboard do Render, clique em "New +"
2. Selecione "Web Service"
3. Conecte seu repositório GitHub `portal-automacao-inteligente`
4. O Render detectará automaticamente o `render.yaml`

#### 4. Configurar Variáveis de Ambiente

Na página de configuração do serviço, adicione as seguintes variáveis:

```
NODE_ENV=production
PORT=3000
REPORTS_SECRET_TOKEN=[gere um token seguro]
ENABLE_REPORTS_SNAPSHOT=true
VITE_ENABLE_REPORTS_EXAMPLE=true
```

**Importante**: Após o primeiro deploy, você precisará atualizar:
- `VITE_REPORTS_API_URL` com a URL do seu app (ex: `https://portal-automacao-inteligente.onrender.com/api/reports`)
- `VITE_REPORTS_FALLBACK_URL` com `https://portal-automacao-inteligente.onrender.com/public/latest.json`

#### 5. Deploy

1. Clique em "Create Web Service"
2. O Render fará o build e deploy automaticamente
3. Aguarde alguns minutos até o deploy ser concluído
4. Acesse a URL fornecida pelo Render

#### 6. Configurar Domínio Customizado (Opcional)

1. No dashboard do serviço, vá em "Settings"
2. Role até "Custom Domains"
3. Adicione seu domínio personalizado
4. Configure os registros DNS conforme instruído

---

## Opção 2: Deploy no Railway.app

Railway oferece uma experiência similar com tier gratuito generoso.

### Passo a Passo

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha o repositório `portal-automacao-inteligente`
6. Configure as variáveis de ambiente (mesmas do Render)
7. Railway detectará automaticamente que é uma aplicação Node.js
8. Aguarde o deploy

---

## Opção 3: Deploy no Fly.io

Fly.io oferece deploy de containers com tier gratuito.

### Passo a Passo

1. Instale o Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Faça login: `fly auth login`
3. No diretório do projeto: `fly launch`
4. Siga as instruções interativas
5. Configure as variáveis de ambiente: `fly secrets set REPORTS_SECRET_TOKEN=seu-token`
6. Deploy: `fly deploy`

---

## Configuração Pós-Deploy

### 1. Atualizar URLs no Frontend

Após o primeiro deploy, você precisa reconstruir o frontend com as URLs corretas:

1. Atualize as variáveis de ambiente com a URL real do seu app
2. Faça um novo commit e push
3. O deploy será refeito automaticamente

### 2. Configurar Webhook do Activepieces

1. No Activepieces, configure o webhook para apontar para:
   ```
   POST https://seu-app.onrender.com/api/reports
   ```
2. Adicione o header de autenticação:
   ```
   Authorization: Bearer SEU_REPORTS_SECRET_TOKEN
   ```

### 3. Testar a Publicação

Use curl para testar a publicação de um relatório:

```bash
curl -X POST https://seu-app.onrender.com/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "teste-deploy",
    "title": "Teste de Deploy",
    "excerpt": "Relatório de teste após deploy",
    "category": "tendencias",
    "date": "2025-12-20T10:00:00Z",
    "content": {
      "type": "html",
      "body": "<h2>Teste</h2><p>Deploy funcionando!</p>"
    }
  }'
```

---

## Monitoramento

### Render.com
- Logs em tempo real no dashboard
- Métricas de uso e performance
- Alertas por email

### Railway.app
- Logs integrados no dashboard
- Métricas de recursos
- Webhooks para notificações

### Fly.io
- Logs: `fly logs`
- Status: `fly status`
- Métricas no dashboard

---

## Troubleshooting

### Site não carrega
- Verifique os logs da plataforma
- Confirme que o build foi bem-sucedido
- Verifique se a porta está configurada corretamente (PORT=3000)

### API retorna erro 503
- Verifique se `REPORTS_SECRET_TOKEN` está configurado
- Veja os logs para identificar o erro específico

### Frontend não carrega dados
- Verifique se `VITE_REPORTS_API_URL` aponta para a URL correta
- Confirme que o backend está respondendo em `/api/reports`
- Verifique o console do navegador para erros de CORS

### Build falha
- Verifique se todas as dependências estão no `package.json`
- Confirme que o comando de build está correto: `npm run build`
- Veja os logs de build para identificar o erro

---

## Custos

### Tier Gratuito - Render.com
- 750 horas/mês (suficiente para 1 app 24/7)
- 512 MB RAM
- Shared CPU
- 100 GB bandwidth/mês
- Suspende após 15 minutos de inatividade (reativa automaticamente)

### Tier Gratuito - Railway.app
- $5 de crédito/mês
- 512 MB RAM
- Shared CPU
- Sem suspensão automática

### Tier Gratuito - Fly.io
- 3 VMs compartilhadas
- 256 MB RAM cada
- 160 GB bandwidth/mês
- Sem suspensão automática

---

## Próximos Passos

1. ✅ Deploy realizado
2. ⬜ Configurar domínio customizado
3. ⬜ Configurar webhook do Activepieces
4. ⬜ Publicar primeiro relatório real
5. ⬜ Configurar monitoramento e alertas
6. ⬜ Implementar backup automático dos dados
7. ⬜ Adicionar analytics (Google Analytics, Plausible, etc.)

---

## Suporte

Se encontrar problemas:
1. Verifique os logs da plataforma
2. Consulte a documentação oficial da plataforma escolhida
3. Verifique o arquivo `ANALISE_PROJETO.md` para problemas conhecidos
