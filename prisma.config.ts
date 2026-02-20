import 'dotenv/config'
import { defineConfig } from 'prisma/config'

function resolveDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim()

  if (!databaseUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'DATABASE_URL environment variable is required in production builds/deployments.'
      )
    }

    return 'file:./prisma/dev.db'
  }

  return databaseUrl
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: resolveDatabaseUrl(),
  },
})
