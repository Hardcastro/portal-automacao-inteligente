const required = (key) => {
  const value = process.env[key]
  if (!value) throw new Error(`Missing env: ${key}`)
  return value
}

export const config = {
  cosmosEndpoint: required('COSMOS_ENDPOINT'),
  cosmosDatabase: required('COSMOS_DATABASE'),
  cosmosPostsContainer: required('COSMOS_CONTAINER_POSTS'),
  cosmosRunsContainer: required('COSMOS_CONTAINER_RUNS'),
  cosmosConfigsContainer: required('COSMOS_CONTAINER_CONFIGS'),
  storageAccountName: required('STORAGE_ACCOUNT_NAME'),
  blogContentContainer: required('BLOG_CONTENT_CONTAINER'),
  blogAssetsContainer: required('BLOG_ASSETS_CONTAINER'),
  reportsQueue: required('REPORTS_QUEUE'),
  reportsDlq: required('REPORTS_DLQ'),
  tenantId: process.env.TENANT_ID || 'public',
  latestLimit: Number(process.env.LATEST_LIMIT || 60),
}
