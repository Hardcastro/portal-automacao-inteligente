# Instruções para fazer upload no GitHub

## Passo 1: Criar repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `portal-automacao-inteligente`
3. Deixe vazio (não marque README, .gitignore ou license)
4. Clique em "Create repository"

## Passo 2: Conectar e fazer push

Execute os seguintes comandos (substitua `SEU_USUARIO` pelo seu username do GitHub):

```bash
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/portal-automacao-inteligente.git
git push -u origin main
```

Se você usar SSH:

```bash
git remote add origin git@github.com:SEU_USUARIO/portal-automacao-inteligente.git
git push -u origin main
```

## Alternativa: Usar GitHub Desktop

Se preferir uma interface gráfica:
1. Instale o GitHub Desktop: https://desktop.github.com/
2. Abra o GitHub Desktop
3. File > Add Local Repository
4. Selecione a pasta do projeto
5. Publish repository

