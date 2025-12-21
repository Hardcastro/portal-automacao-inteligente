-- Ajusta idempotency_keys para suportar headers e chave composta
ALTER TABLE "IdempotencyKey" ADD COLUMN IF NOT EXISTS "responseHeaders" JSONB;

DROP INDEX IF EXISTS "IdempotencyKey_tenantId_key_key";
CREATE UNIQUE INDEX "IdempotencyKey_tenantId_key_method_path_key" ON "IdempotencyKey"("tenantId", "key", "method", "path");
