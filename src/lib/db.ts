import { PrismaClient } from '@prisma/client'
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
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'DATABASE_URL is required in production. ' +
        'Use PostgreSQL (for example Neon) or provide a SQLite file URL.'
      )
    }
    return 'file:./prisma/dev.db'
  }

  return databaseUrl
}

function createPrismaClient() {
  const databaseUrl = resolveDatabaseUrl()
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = databaseUrl
  }

  const log = process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']

  if (POSTGRES_URL_PATTERN.test(databaseUrl)) {
    const pool = new Pool({
      connectionString: databaseUrl,
    })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({
      adapter,
      log,
    })
  }

  if (!databaseUrl.startsWith('file:')) {
    throw new Error(
      'Unsupported DATABASE_URL scheme. Use PostgreSQL (for example Neon) or file:./prisma/dev.db.'
    )
  }

  return new PrismaClient({
    log,
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
