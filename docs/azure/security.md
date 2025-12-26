# Secrets and Identity

## Managed identity

- Function App uses system-assigned identity.
- RBAC grants:
  - Storage Blob Data Contributor
  - Storage Queue Data Contributor
  - Cosmos DB Built-in Data Contributor
  - Key Vault Secrets User

## Secrets

- No connection strings in repo.
- `AzureWebJobsStorage` is injected via Key Vault reference.
- Add any external API secrets to Key Vault and reference in app settings.

## CORS

- Restrict Function App CORS to the public blog domain(s).
- Avoid wildcard `*` for production.
