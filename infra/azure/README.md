# Azure Landing Zone

This folder provisions the minimum Azure resources for the blog automation:
- Resource Group (per environment)
- Storage Account (blob + queue)
- Cosmos DB (serverless)
- Function App (managed identity)
- Application Insights
- Key Vault

## Deploy (subscription scope)

```bash
az deployment sub create \
  --location brazilsouth \
  --template-file infra/azure/subscription.bicep \
  --parameters resourceGroupName=rg-portal-dev location=brazilsouth env=dev
```

## Notes

- Storage containers: blog-content, blog-assets, exports, system
- Queues: report-jobs, report-dlq
- Cosmos DB database: portal (containers: posts, runs, configs)
- Function App uses managed identity + Key Vault for AzureWebJobsStorage

## Post-deploy checks

1) Confirm Function App can read/write Cosmos and Blob using managed identity.
2) Upload a test blob to `blog-content`.
3) Enqueue a message into `report-jobs`.
4) Verify logs in Application Insights.
