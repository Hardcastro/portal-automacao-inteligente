import { PrismaClient } from '@prisma/client'
import { config } from './env.js'
import { PrismaClient as MemoryPrismaClient } from './prismaMemory.js'

export type PrismaClientLike = PrismaClient | MemoryPrismaClient

let prisma: PrismaClientLike | null = null

export const getPrisma = (): PrismaClientLike => {
  if (!prisma) {
    prisma = config.USE_INMEMORY_STUBS ? new MemoryPrismaClient() : new PrismaClient()
  }
  return prisma
}

export const closePrisma = async (): Promise<void> => {
  if (!prisma) return
  await prisma.$disconnect()
  prisma = null
}

export const resetPrisma = (): void => {
  if (prisma && 'reset' in prisma && typeof prisma.reset === 'function') {
    prisma.reset()
  }
}
