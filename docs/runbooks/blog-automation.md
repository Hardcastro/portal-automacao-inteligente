# Runbook - Blog Automation

## Signals and alerts

- Queue depth > 0 for more than 30 min
- Worker failures > 0 in 1 hour
- DLQ messages > 0
- Function errors in Application Insights

## Common fields for logs

- correlationId
- jobId
- runId
- slug
- status

## Reprocess a job

1) Find the failed run in Cosmos `runs` container by `runId` or `correlationId`.
2) Fix the root cause (data, config, or code).
3) Enqueue a new message to `report-jobs` with the same payload and `idempotencyKey`.
4) Confirm the run status becomes `SUCCEEDED`.

## Handle DLQ

1) Read the DLQ payload in `report-dlq`.
2) Inspect the `error` and `payload`.
3) Decide: requeue as-is, edit payload, or drop.
4) After requeue, delete the DLQ message.

## Verify publication

1) Confirm the post exists in Cosmos `posts` with status `PUBLISHED`.
2) Confirm blob exists in `blog-content` and `blog-assets/latest.json` updated.
3) Call GET `/blog/posts` and GET `/blog/posts/{slug}` and verify the UI.
