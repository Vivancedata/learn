import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  seed: 'ts-node --compiler-options {"module":"commonjs"} prisma/seed.ts',
})
