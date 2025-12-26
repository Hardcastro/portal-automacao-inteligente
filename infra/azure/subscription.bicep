@description('Resource group name.')
param resourceGroupName string

@description('Location for the resource group.')
param location string

@description('Environment name (dev/prod).')
param env string

@description('Tags to apply to the resource group.')
param tags object = {
  env: env
  owner: 'portal'
  costCenter: 'blog'
}

resource rg 'Microsoft.Resources/resourceGroups@2024-07-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

module landingZone 'main.bicep' = {
  name: 'landingZone'
  scope: rg
  params: {
    env: env
    location: location
    tags: tags
    storageAccountName: 'st${uniqueString(resourceGroupName, env)}'
    cosmosAccountName: 'cosmos${uniqueString(resourceGroupName, env)}'
    functionAppName: 'func-${uniqueString(resourceGroupName, env)}'
    appInsightsName: 'appi-${uniqueString(resourceGroupName, env)}'
    keyVaultName: 'kv-${uniqueString(resourceGroupName, env)}'
  }
}
