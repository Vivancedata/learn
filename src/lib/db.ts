import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient }
let prismaClient: PrismaClient | undefined

function resolveDatabaseUrl(): string {
  const databaseUrl =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim()

  if (!databaseUrl) {
    throw new Error(
      'Postgres connection string is required. ' +
      'Set DATABASE_URL (or POSTGRES_PRISMA_URL/POSTGRES_URL on Vercel).'
    )
  }

  if (!/^(postgres|postgresql|prisma\+postgres):\/\//.test(databaseUrl)) {
    throw new Error(
      'DATABASE_URL must be a PostgreSQL connection string (for example Neon).'
    )
  }

  return databaseUrl
}

function createPrismaClient() {
  const databaseUrl = resolveDatabaseUrl()
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

function getPrismaClient(): PrismaClient {
  if (prismaClient) {
    return prismaClient
  }

  prismaClient = globalForPrisma.prisma || createPrismaClient()

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient
  }

  return prismaClient
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient()
    const value = Reflect.get(client as object, property, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
  set(_target, property, value, receiver) {
    return Reflect.set(getPrismaClient() as object, property, value, receiver)
  },
}) as PrismaClient

export default prisma
