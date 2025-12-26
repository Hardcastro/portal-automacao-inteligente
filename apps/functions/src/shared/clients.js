import { DefaultAzureCredential } from '@azure/identity'
import { CosmosClient } from '@azure/cosmos'
import { BlobServiceClient } from '@azure/storage-blob'
import { QueueServiceClient } from '@azure/storage-queue'
import { config } from './config.js'

const credential = new DefaultAzureCredential()

export const cosmosClient = new CosmosClient({
  endpoint: config.cosmosEndpoint,
  aadCredentials: credential,
})

const storageUrl = `https://${config.storageAccountName}.blob.core.windows.net`
export const blobServiceClient = new BlobServiceClient(storageUrl, credential)

const queueUrl = `https://${config.storageAccountName}.queue.core.windows.net`
export const queueServiceClient = new QueueServiceClient(queueUrl, credential)
