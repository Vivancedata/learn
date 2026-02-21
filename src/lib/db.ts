import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient }
const POSTGRES_URL_PATTERN = /^(postgres|postgresql|prisma\+postgres):\/\//

function resolveDatabaseUrl(): string {
  const databaseUrl =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim()

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required. Set DATABASE_URL (or POSTGRES_PRISMA_URL/POSTGRES_URL) to a PostgreSQL connection string.'
    )
  }

  if (!POSTGRES_URL_PATTERN.test(databaseUrl)) {
    throw new Error(
      'Unsupported DATABASE_URL scheme. Use PostgreSQL (postgres://, postgresql://, or prisma+postgres://).'
    )
  }

  return databaseUrl
}

function createPrismaClient() {
  const databaseUrl = resolveDatabaseUrl()
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = databaseUrl
  }

  const log: Prisma.LogLevel[] =
    process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']

  const pool = new Pool({
    connectionString: databaseUrl,
    max: process.env.NODE_ENV === 'development' ? 5 : 20,
  })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log,
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
