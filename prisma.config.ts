import 'dotenv/config'
import { defineConfig } from 'prisma/config'

const FALLBACK_PRISMA_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/postgres'

function resolveDatabaseUrl(): string {
  const databaseUrl =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim()

  if (!databaseUrl) {
    // Prisma client generation only needs a syntactically valid datasource URL.
    return FALLBACK_PRISMA_DATABASE_URL
  }

  if (!/^(postgres|postgresql|prisma\+postgres):\/\//.test(databaseUrl)) {
    throw new Error(
      'DATABASE_URL must be a PostgreSQL connection string (for example Neon).'
    )
  }

  return databaseUrl
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: resolveDatabaseUrl(),
  },
})
