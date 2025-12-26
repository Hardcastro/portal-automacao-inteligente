import { config } from './config.js'

const defaultAuthor = 'Motor Inteligente'

export const mapPostToReport = (doc, options = {}) => {
  if (!doc) return null
  const date = doc.publishedAt || doc.createdAt
  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt || '',
    category: doc.category || 'tendencias',
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    date: date,
    readTime: doc.readTime,
    author: doc.author || defaultAuthor,
    content: options.content || undefined,
    contentUrl: doc.contentUrl ?? null,
    thumbnail: doc.thumbnail ?? null,
  }
}

export const buildListResponse = (items, meta = {}) => ({
  reports: items.filter(Boolean),
  meta: {
    total: items.length,
    nextCursor: meta.nextCursor || null,
  },
})

export const buildEtag = (doc) => doc?._etag || undefined

export const buildLastModified = (doc) => {
  if (doc?.updatedAt) return new Date(doc.updatedAt).toUTCString()
  if (doc?.publishedAt) return new Date(doc.publishedAt).toUTCString()
  return undefined
}

export const parseIfNoneMatch = (request) => request.headers.get('if-none-match')
export const parseIfModifiedSince = (request) => request.headers.get('if-modified-since')

export const isNotModified = (etag, lastModified, ifNoneMatch, ifModifiedSince) => {
  if (etag && ifNoneMatch && ifNoneMatch.replace(/\"/g, '') === etag.replace(/\"/g, '')) {
    return true
  }
  if (lastModified && ifModifiedSince) {
    const reqTime = Date.parse(ifModifiedSince)
    const resTime = Date.parse(lastModified)
    if (!Number.isNaN(reqTime) && !Number.isNaN(resTime) && resTime <= reqTime) {
      return true
    }
  }
  return false
}

export const withTenant = (doc) => ({
  ...doc,
  tenantId: doc?.tenantId || config.tenantId,
})
