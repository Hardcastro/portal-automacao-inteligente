# Blog API Contract (Frontend Freeze)

Purpose: keep the Blog tab stable while backend changes. Any change here must be deliberate and versioned.

## Endpoints (read)

Legacy (current frontend default):
- GET `/api/reports?limit={n}`
- GET `/api/reports/{slug}`

Azure read API (new target, same payloads):
- GET `/blog/posts?limit={n}`
- GET `/blog/posts/{slug}`

Static fallback:
- GET `/public/latest.json`

## List response

Accepted shapes (frontend supports all):

1) Array of reports:
```json
[
  { "id": "...", "slug": "...", "title": "...", "date": "...", "category": "...", "excerpt": "..." }
]
```

2) Object with `reports` + `meta`:
```json
{
  "reports": [ { "id": "...", "slug": "...", "title": "...", "date": "...", "category": "...", "excerpt": "..." } ],
  "meta": { "total": 1, "nextCursor": null }
}
```

3) Object with `latest` (fallback):
```json
{
  "latest": { "id": "...", "slug": "...", "title": "...", "date": "...", "category": "...", "excerpt": "..." },
  "meta": { "total": 1 }
}
```

## Detail response

```json
{
  "id": "...",
  "slug": "slug-lowercase-hyphen",
  "title": "Titulo do relatorio",
  "date": "2024-01-15T10:00:00Z",
  "category": "geopolitica|macroeconomia|tendencias|mercados|outros",
  "excerpt": "Resumo curto",
  "author": "Motor Inteligente",
  "readTime": 5,
  "tags": ["tag1", "tag2"],
  "content": { "type": "html|markdown", "body": "<p>...</p>" },
  "contentUrl": "https://.../arquivo.pdf",
  "thumbnail": "https://.../thumb.png"
}
```

## Field rules

- `id`: required, stable unique id (UUID preferred).
- `slug`: required, lowercase + hyphen, regex `^[a-z0-9-]+$`. Preserve exactly.
- `title`: required, non-empty.
- `date`: required, ISO 8601 string. Used for ordering and display.
- `category`: required, one of `geopolitica|macroeconomia|tendencias|mercados|outros`.
- `excerpt`: required for list UI. If missing, frontend will synthesize from content, but do not rely on it.
- `content`: optional in list; required in detail unless `contentUrl` is provided.
- `tags`: optional; max 10 items.
- `author`: optional; defaults to "Motor Inteligente".
- `readTime`: optional integer minutes.

## Ordering and pagination

- Order by `date` desc (fallback to `createdAt` desc if equal).
- List `limit` default 60; max 200.
- `meta.nextCursor` is optional; if present, treat as opaque.

## Status codes

- 200: OK
- 304: Not Modified (when `ETag` or `If-Modified-Since` matches)
- 400: Invalid query or slug
- 404: Not found (detail)
- 500: Server error

## Compatibility notes

- The frontend normalizes payloads but rejects invalid `slug`, missing `title`, or missing `date`.
- Changing field names, types, or ordering can silently break UI. Do not change without updating fixtures + tests.
