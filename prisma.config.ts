import 'dotenv/config'
import { defineConfig } from 'prisma/config'

const POSTGRES_URL_PATTERN = /^(postgres|postgresql|prisma\+postgres):\/\//

function resolveDatabaseUrl(): string {
  const databaseUrl =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim()

  if (!databaseUrl) {
    return 'postgresql://postgres:postgres@127.0.0.1:5432/learn'
  }

  if (!POSTGRES_URL_PATTERN.test(databaseUrl)) {
    throw new Error(
      'DATABASE_URL must be PostgreSQL (postgres://, postgresql://, or prisma+postgres://).'
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
