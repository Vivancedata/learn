import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  // jsdom resolves the "browser" export condition, which for lucide-react (and
  // therefore for every @vivancedata/ui component that imports an icon) is an
  // ESM bundle that next/jest never transforms, so any component test failed
  // to parse. Preferring "node" picks the published CJS build instead.
  testEnvironmentOptions: {
    customExportConditions: ['node', 'require', 'default'],
  },
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],
  // Transform ES modules from these packages
  transformIgnorePatterns: [
    '/node_modules/(?!(uncrypto|@upstash)/)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig)
