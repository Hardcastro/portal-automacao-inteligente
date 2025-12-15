# Avaliação de inconsistências

## Problemas críticos identificados

1. **Exposição a path traversal nas rotas estáticas do `server.js`**
   - Em `handleStaticRequest`/`serveStaticFile` os caminhos são montados com `path.join` a partir de `pathname` decodificado, sem validar que o resultado permanece dentro de `public` ou `dist`. Um path como `/../../etc/passwd` é normalizado para fora do diretório base e, se o arquivo existir, será servido. Isso abre acesso de leitura a qualquer arquivo do servidor que o processo tenha permissão para ler.

2. **Queda do servidor para URLs malformadas**
   - O `decodeURIComponent(pathname)` é chamado sem `try/catch`. Um `%` isolado ou sequência inválida dispara exceção e encerra a requisição com erro 500, potencialmente derrubando o worker dependendo da configuração do Node.

3. **Fallback de dados redundante em `data/reportsData.js`**
   - `PUBLIC_REPORTS_FILE` e `LEGACY_PUBLIC_FILE` apontam para o mesmo caminho (`public/reports.json`). O bloco que tenta carregar dados legados nunca usará um arquivo diferente, tornando o fallback inoperante e ocultando casos em que o arquivo legado estivesse em outro local.

## Recomendações

- Blindar o servidor contra path traversal validando que qualquer arquivo solicitado permaneça dentro de `public` ou `dist` (por exemplo, usando `path.resolve` + prefix check) e recusando caminhos que escapem dessas raízes.
- Proteger a etapa de decode das URLs com tratamento de exceção e retornar 400 quando a URL for inválida, evitando que entradas malformadas gerem exceções não tratadas.
- Corrigir o fallback de dados para apontar para o arquivo legado correto (ou remover a constante) garantindo que a inicialização do repositório de relatórios use a fonte pretendida.
