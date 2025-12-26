import { app } from '@azure/functions'
import { cosmosClient } from '../shared/clients.js'
import { config } from '../shared/config.js'
import {
  buildListResponse,
  mapPostToReport,
  parseIfModifiedSince,
  parseIfNoneMatch,
  buildEtag,
  buildLastModified,
  isNotModified,
} from '../shared/transform.js'

app.http('blogPosts', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'blog/posts',
  handler: async (request, context) => {
    const limit = Math.min(Number(request.query.get('limit') || 60), 200)
    const cursor = request.query.get('cursor')

    const container = cosmosClient
      .database(config.cosmosDatabase)
      .container(config.cosmosPostsContainer)

    const query = {
      query: `SELECT * FROM c
        WHERE c.tenantId = @tenantId AND c.status = 'PUBLISHED'
        ORDER BY c.publishedAt DESC, c.createdAt DESC`,
      parameters: [{ name: '@tenantId', value: config.tenantId }],
    }

    const iterator = container.items.query(query, {
      maxItemCount: limit,
      continuationToken: cursor || undefined,
    })

    const { resources, continuationToken } = await iterator.fetchNext()
    const items = (resources || []).map((doc) => mapPostToReport(doc))

    const etag = resources?.[0] ? buildEtag(resources[0]) : undefined
    const lastModified = resources?.[0] ? buildLastModified(resources[0]) : undefined
    const ifNoneMatch = parseIfNoneMatch(request)
    const ifModifiedSince = parseIfModifiedSince(request)
    if (isNotModified(etag, lastModified, ifNoneMatch, ifModifiedSince)) {
      return { status: 304 }
    }

    const response = buildListResponse(items, { nextCursor: continuationToken })
    return {
      status: 200,
      jsonBody: response,
      headers: {
        ...(etag ? { ETag: etag } : {}),
        ...(lastModified ? { 'Last-Modified': lastModified } : {}),
      },
    }
  },
})
