# Queue choice (Azure)

Default: Storage Queue (cheap + simple).

Use Service Bus when you need:
- DLQ with TTL and richer diagnostics
- Topics/subscriptions
- Ordered sessions

Current IaC provisions Storage Queue with `report-jobs` and `report-dlq`.
