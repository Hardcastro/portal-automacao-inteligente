import { app } from '@azure/functions'
import { cosmosClient, blobServiceClient } from '../shared/clients.js'
import { config } from '../shared/config.js'
import {
  mapPostToReport,
  parseIfModifiedSince,
  parseIfNoneMatch,
  buildEtag,
  buildLastModified,
  isNotModified,
} from '../shared/transform.js'

const loadBlobContent = async (blobPath) => {
  const container = blobServiceClient.getContainerClient(config.blogContentContainer)
  const blob = container.getBlobClient(blobPath)
  const response = await blob.download()
  const content = await response.blobBody?.text()
  return content || ''
}

app.http('blogPostBySlug', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'blog/posts/{slug}',
  handler: async (request, context) => {
    const slug = request.params.slug
    if (!slug) return { status: 400, jsonBody: { message: 'slug required' } }

    const container = cosmosClient
      .database(config.cosmosDatabase)
      .container(config.cosmosPostsContainer)

    const query = {
      query: `SELECT * FROM c WHERE c.tenantId = @tenantId AND c.slug = @slug`,
      parameters: [
        { name: '@tenantId', value: config.tenantId },
        { name: '@slug', value: slug },
      ],
    }

    const { resources } = await container.items.query(query).fetchAll()
    const doc = resources?.[0]
    if (!doc) return { status: 404 }

    const etag = buildEtag(doc)
    const lastModified = buildLastModified(doc)
    const ifNoneMatch = parseIfNoneMatch(request)
    const ifModifiedSince = parseIfModifiedSince(request)
    if (isNotModified(etag, lastModified, ifNoneMatch, ifModifiedSince)) {
      return { status: 304 }
    }

    let content = null
    if (doc.content && doc.content.body) {
      content = doc.content
    } else if (doc.contentBlobPath) {
      const body = await loadBlobContent(doc.contentBlobPath)
      content = { type: doc.contentType || 'markdown', body }
    }

    const report = mapPostToReport(doc, { content })
    return {
      status: 200,
      jsonBody: report,
      headers: {
        ...(etag ? { ETag: etag } : {}),
        ...(lastModified ? { 'Last-Modified': lastModified } : {}),
      },
    }
  },
})
