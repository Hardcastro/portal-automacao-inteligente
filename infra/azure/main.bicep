@description('Environment name (dev/prod).')
param env string

@description('Location for all resources.')
param location string = resourceGroup().location

@description('Tags to apply to all resources.')
param tags object = {
  env: env
  owner: 'portal'
  costCenter: 'blog'
}

@description('Storage account name (globally unique).')
param storageAccountName string

@description('Cosmos DB account name (globally unique).')
param cosmosAccountName string

@description('Function App name (globally unique).')
param functionAppName string

@description('Application Insights name.')
param appInsightsName string

@description('Key Vault name (globally unique).')
param keyVaultName string

@description('Cosmos DB database name.')
param cosmosDatabaseName string = 'portal'

@description('Cosmos containers.')
param cosmosContainers array = [
  {
    name: 'posts'
    partitionKey: '/tenantId'
  }
  {
    name: 'runs'
    partitionKey: '/tenantId'
  }
  {
    name: 'configs'
    partitionKey: '/tenantId'
  }
]

@description('Storage blob containers.')
param blobContainers array = [
  'blog-content'
  'blog-assets'
  'exports'
  'system'
]

@description('Storage queues.')
param queues array = [
  'report-jobs'
  'report-dlq'
]

var storageApiVersion = '2023-01-01'
var cosmosApiVersion = '2024-05-15'
var webApiVersion = '2023-12-01'
var insightsApiVersion = '2020-02-02'
var kvApiVersion = '2023-07-01'

resource storageAccount 'Microsoft.Storage/storageAccounts@${storageApiVersion}' = {
  name: storageAccountName
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@${storageApiVersion}' = {
  name: '${storageAccount.name}/default'
}

resource blobContainersResource 'Microsoft.Storage/storageAccounts/blobServices/containers@${storageApiVersion}' = [for containerName in blobContainers: {
  name: '${storageAccount.name}/default/${containerName}'
  properties: {
    publicAccess: 'None'
  }
  dependsOn: [
    blobService
  ]
}]

resource queueService 'Microsoft.Storage/storageAccounts/queueServices@${storageApiVersion}' = {
  name: '${storageAccount.name}/default'
}

resource queueResources 'Microsoft.Storage/storageAccounts/queueServices/queues@${storageApiVersion}' = [for queueName in queues: {
  name: '${storageAccount.name}/default/${queueName}'
  dependsOn: [
    queueService
  ]
}]

resource storageLifecycle 'Microsoft.Storage/storageAccounts/managementPolicies@2023-01-01' = {
  name: '${storageAccount.name}/default'
  properties: {
    policy: {
      rules: [
        {
          name: 'blog-content-lifecycle'
          enabled: true
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'blog-content/'
                'exports/'
              ]
            }
            actions: {
              baseBlob: {
                tierToCool: {
                  daysAfterModificationGreaterThan: 30
                }
                tierToArchive: {
                  daysAfterModificationGreaterThan: 180
                }
              }
            }
          }
        }
      ]
    }
  }
}

resource cosmos 'Microsoft.DocumentDB/databaseAccounts@${cosmosApiVersion}' = {
  name: cosmosAccountName
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@${cosmosApiVersion}' = {
  name: '${cosmos.name}/${cosmosDatabaseName}'
  properties: {
    resource: {
      id: cosmosDatabaseName
    }
  }
}

resource cosmosContainersResource 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@${cosmosApiVersion}' = [for container in cosmosContainers: {
  name: '${cosmos.name}/${cosmosDatabaseName}/${container.name}'
  properties: {
    resource: {
      id: container.name
      partitionKey: {
        paths: [
          container.partitionKey
        ]
        kind: 'Hash'
      }
    }
  }
  dependsOn: [
    cosmosDatabase
  ]
}]

resource appInsights 'Microsoft.Insights/components@${insightsApiVersion}' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@${webApiVersion}' = {
  name: '${functionAppName}-plan'
  location: location
  tags: tags
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: 'functionapp'
}

resource keyVault 'Microsoft.KeyVault/vaults@${kvApiVersion}' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    sku: {
      name: 'standard'
      family: 'A'
    }
  }
}

var storageKeys = listKeys(storageAccount.id, storageApiVersion)
var storageConnectionString = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageKeys.keys[0].value};EndpointSuffix=${environment().suffixes.storage}'

resource storageSecret 'Microsoft.KeyVault/vaults/secrets@${kvApiVersion}' = {
  name: '${keyVault.name}/StorageConnectionString'
  properties: {
    value: storageConnectionString
  }
  dependsOn: [
    keyVault
  ]
}

resource functionApp 'Microsoft.Web/sites@${webApiVersion}' = {
  name: functionAppName
  location: location
  tags: tags
  kind: 'functionapp'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: '@Microsoft.KeyVault(SecretUri=${storageSecret.properties.secretUriWithVersion})'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'COSMOS_ENDPOINT'
          value: cosmos.properties.documentEndpoint
        }
        {
          name: 'COSMOS_DATABASE'
          value: cosmosDatabaseName
        }
        {
          name: 'COSMOS_CONTAINER_POSTS'
          value: 'posts'
        }
        {
          name: 'COSMOS_CONTAINER_RUNS'
          value: 'runs'
        }
        {
          name: 'COSMOS_CONTAINER_CONFIGS'
          value: 'configs'
        }
        {
          name: 'STORAGE_ACCOUNT_NAME'
          value: storageAccount.name
        }
        {
          name: 'BLOG_CONTENT_CONTAINER'
          value: 'blog-content'
        }
        {
          name: 'BLOG_ASSETS_CONTAINER'
          value: 'blog-assets'
        }
        {
          name: 'REPORTS_QUEUE'
          value: 'report-jobs'
        }
        {
          name: 'REPORTS_DLQ'
          value: 'report-dlq'
        }
        {
          name: 'WEBSITE_TIME_ZONE'
          value: 'America/Sao_Paulo'
        }
        {
          name: 'TENANT_ID'
          value: 'public'
        }
      ]
    }
  }
}

var storageBlobRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
var storageQueueRoleId = '974c5e8b-45b9-4653-ba55-5f855dd0fb88'
var cosmosRoleId = '5bd9cd88-fe45-4216-938b-f97437e15450'
var keyVaultRoleId = '4633458b-17de-408a-b874-0445c86b69e6'

resource storageBlobRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, functionApp.name, storageBlobRoleId)
  scope: storageAccount
  properties: {
    principalId: functionApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobRoleId)
    principalType: 'ServicePrincipal'
  }
}

resource storageQueueRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, functionApp.name, storageQueueRoleId)
  scope: storageAccount
  properties: {
    principalId: functionApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageQueueRoleId)
    principalType: 'ServicePrincipal'
  }
}

resource cosmosRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(cosmos.id, functionApp.name, cosmosRoleId)
  scope: cosmos
  properties: {
    principalId: functionApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', cosmosRoleId)
    principalType: 'ServicePrincipal'
  }
}

resource keyVaultRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, functionApp.name, keyVaultRoleId)
  scope: keyVault
  properties: {
    principalId: functionApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultRoleId)
    principalType: 'ServicePrincipal'
  }
}
