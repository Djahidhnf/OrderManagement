import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import fs from 'node:fs'
import path from 'node:path'

// Load .env since tsx doesn't go through Next.js or Prisma CLI env loading
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

async function createPrisma(): Promise<PrismaClient> {
  if (process.env.DATABASE_URL?.includes('neon.tech')) {
    const { PrismaNeon } = await import('@prisma/adapter-neon')
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
    return new PrismaClient({ adapter } as never)
  }
  const { Pool } = await import('pg')
  const { PrismaPg } = await import('@prisma/adapter-pg')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter } as never)
}

async function main() {
  const prisma = await createPrisma()
  const password = await bcrypt.hash('Admin123!', 12)

  await prisma.users.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      phone: '0000000000',
      password,
      role: 'Admin',
    },
  });

  console.log('Admin created: admin / Admin123!')

  await prisma.users.upsert({
    where: { username: 'wordexpress' },
    update: {},
    create: {
      username: 'wordexpress',
      phone: '0000000000',
      password,
      role: 'Livreur',
    },
  });

  console.log('Delivery created: wordexpress / Admin123!')
  await prisma.$disconnect()
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
