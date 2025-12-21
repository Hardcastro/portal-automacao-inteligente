import 'dotenv/config'
import crypto from 'node:crypto'
import { ApiKeyStatus, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const hashApiKey = (rawKey, pepper) => {
  return crypto.createHash('sha256').update(`${pepper}:${rawKey}`).digest('hex')
}

const buildScopes = () => [
  'reports:read',
  'reports:write',
  'automation:trigger',
  'webhooks:callback',
]

async function main() {
  const tenantSlug = process.env.SEED_TENANT_SLUG || 'aetherflow-demo'
  const tenantName = process.env.SEED_TENANT_NAME || 'Tenant Demo AetherFlow'
  const rawApiKey = process.env.SEED_API_KEY || 'dev-portal-api-key'
  const pepper = process.env.API_KEY_PEPPER || 'change-me'

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: { name: tenantName },
    create: { slug: tenantSlug, name: tenantName },
  })

  const keyHash = hashApiKey(rawApiKey, pepper)

  const apiKey = await prisma.apiKey.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'default-admin' } },
    update: {
      keyHash,
      scopes: buildScopes(),
      status: ApiKeyStatus.ACTIVE,
    },
    create: {
      tenantId: tenant.id,
      name: 'default-admin',
      scopes: buildScopes(),
      keyHash,
      status: ApiKeyStatus.ACTIVE,
    },
  })

  console.info('Seed concluído com sucesso', {
    tenantSlug,
    tenantId: tenant.id,
    apiKeyName: apiKey.name,
    apiKey: rawApiKey,
  })
}

main()
  .catch((err) => {
    console.error('Falha ao executar seed', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
