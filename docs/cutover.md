# Cutover and Rollback

## Parallel run

1) Deploy Azure Functions read API to staging.
2) Point frontend in staging to `VITE_REPORTS_API_URL` = new `/blog/posts` base.
3) Validate contract tests + UI.

## Shadow traffic (optional)

- Mirror `/api/reports` calls to Azure Functions and compare responses.
- Any drift must update fixtures + contract spec before cutover.

## Cutover

1) Update production frontend env to the new endpoint.
2) Confirm `/blog` list and `/blog/{slug}` detail.

## Rollback (<= 5 minutes)

1) Revert `VITE_REPORTS_API_URL` to old endpoint.
2) Flush any CDN or cache if used.
3) Verify UI is back to previous data source.

## Data compatibility

- Keep the same slug format.
- Keep `date`, `category`, and `excerpt` semantics identical.
