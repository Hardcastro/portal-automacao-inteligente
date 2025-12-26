# CI/CD

Workflow: `.github/workflows/azure-deploy.yml`

Secrets required:
- AZURE_CLIENT_ID
- AZURE_TENANT_ID
- AZURE_SUBSCRIPTION_ID
- AZURE_FUNCTIONAPP_NAME

Usage:
- Run the workflow manually and provide environment + resource group.
- Infra is deployed via Bicep.
- Functions are deployed from `apps/functions`.

Notes:
- Use environments in GitHub to separate dev/prod secrets.
- Keep `VITE_REPORTS_API_URL` configured in the frontend build for cutover.
