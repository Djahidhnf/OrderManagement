import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  if (process.env.DATABASE_URL?.includes('neon.tech')) {
    const { PrismaNeon } = require('@prisma/adapter-neon')
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
    return new PrismaClient({ adapter })
  }
  const { Pool } = require('pg')
  const { PrismaPg } = require('@prisma/adapter-pg')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}