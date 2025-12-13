# Portal de Automação Inteligente

Portal React/Vite com backend Node que recebe relatórios gerados pelo Activepieces, persiste snapshots JSON e entrega as páginas do SPA a partir da pasta `dist`.

## 🚀 Tecnologias
- **React 18** + **Vite**
- **Tailwind CSS**
- **Framer Motion**
- **React Router**
- **Node (HTTP)** para APIs e entrega dos assets estáticos

## 📦 Scripts
- `npm run dev` – ambiente de desenvolvimento do Vite
- `npm run build` – gera o bundle de produção em `dist/`
- `npm run start` – inicia o servidor Node que expõe `/api/reports` e serve os arquivos estáticos

## 🌐 Variáveis de Ambiente
Crie um `.env.production` com:
```
VITE_REPORTS_API_URL="https://portal-automacao-inteligente.onrender.com/api/reports"
VITE_REPORTS_FALLBACK_URL="https://portal-automacao-inteligente.onrender.com/public/latest.json"
REPORTS_SECRET_TOKEN=<seu_token_seguro>
```
Use valores equivalentes para desenvolvimento conforme o ambiente de deploy (Render).

## 🧠 API de Relatórios
### POST /api/reports
- Autenticação: `Authorization: Bearer <REPORTS_SECRET_TOKEN>`
- Corpo: objeto único, array ou `{ reports: [...] }` com campos obrigatórios `id`, `slug`, `title`, `excerpt`, `category`, `date` e `content` **ou** `contentUrl`.
- Normalizações automáticas:
  - Geração de `id` (UUID v4) se ausente.
  - `slug` derivado do título em minúsculas com hífens.
  - `excerpt` a partir das primeiras frases/250 caracteres do conteúdo/título.
  - `readTime` estimado a ~200 wpm.
  - `pdfUrl`/`file` são aceitos como `contentUrl`.
- Resposta: `201` com `{ message, total, lastUpdated }` ou `400` em caso de erro de validação.

### GET /api/reports?limit=60
Retorna os relatórios mais recentes ordenados por data (padrão `limit=60`, máximo 200) no formato:
```
{
  "reports": [ ... ],
  "meta": { "total": <num>, "lastUpdated": <ISO> }
}
```

### GET /api/reports/:slug
Retorna um único relatório pelo `slug` ou `404` se não encontrado.

### Persistência e Fallback
- Os relatórios são mantidos em memória e gravados em `data/reports.json`.
- Snapshots são atualizados em `public/reports.json` e `public/latest.json`, usados pelo frontend como fallback offline.
- Payload máximo aceito: ~1 MB.

## 🖥️ Front-end
- Usa `VITE_REPORTS_API_URL` como fonte primária; cai para `VITE_REPORTS_FALLBACK_URL` e, por fim, para `src/data/reports.example.json`.
- Cache local em `localStorage` para leitura offline e hidratação inicial.
- Blog (`/blog`) lista cards com título, excerpt, categoria, tags, tempo de leitura, autor e CTA único.
- Página de relatório (`/blog/:slug`) tenta buscar o item individual; renderiza HTML embutido ou incorpora PDF via `contentUrl`.

## 🚀 Deploy
- Build: `npm install && npm run build`
- Start: `npm run start` (server entrega `dist/` e as rotas da API).
- Para domínio próprio (ex.: aetherflow.digital), configure o serviço no Render e aponte DNS conforme o painel da plataforma.

## 📄 Licença
Projeto privado.
