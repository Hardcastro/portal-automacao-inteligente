@echo off
echo ========================================
echo Upload para GitHub - Portal Automação
echo ========================================
echo.
echo Por favor, informe seu username do GitHub:
set /p GITHUB_USER="Username: "
echo.
echo Criando conexão com o repositório remoto...
git remote add origin https://github.com/%GITHUB_USER%/portal-automacao-inteligente.git
echo.
echo Fazendo push para o GitHub...
git push -u origin main
echo.
echo ========================================
echo Concluído!
echo ========================================
pause

