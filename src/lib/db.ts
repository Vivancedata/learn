import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function resolveDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim()

  if (!databaseUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'DATABASE_URL environment variable is required in production. ' +
        'Refusing to silently fall back to a local SQLite file.'
      )
    }

    return 'file:./prisma/dev.db'
  }

  if (
    process.env.NODE_ENV === 'production' &&
    databaseUrl.startsWith('file:') &&
    process.env.ALLOW_FILE_DATABASE_IN_PRODUCTION !== 'true'
  ) {
    throw new Error(
      'File-based DATABASE_URL is disabled in production by default. ' +
      'Use a hosted LibSQL/Turso URL, or explicitly set ALLOW_FILE_DATABASE_IN_PRODUCTION=true.'
    )
  }

  return databaseUrl
}

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: resolveDatabaseUrl(),
  })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
