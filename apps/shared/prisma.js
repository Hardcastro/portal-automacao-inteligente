import { PrismaClient } from './prismaClient.js'

let singleton

export const createPrismaClient = () => new PrismaClient()

export const prisma = (() => {
  if (!singleton) {
    singleton = new PrismaClient()
  }
  return singleton
})()

export const resetPrisma = () => {
  if (singleton?.reset) singleton.reset()
}
