import { GET as getHealth } from '../health/route'
import { GET as getReadiness } from '../readiness/route'
import prisma from '@/lib/db'
import rateLimiter from '@/lib/rate-limit'
import { checkRedisHealth, isRedisConfigured } from '@/lib/redis'

const prismaMock = prisma as unknown as {
  $queryRaw: jest.Mock
}

const rateLimiterMock = rateLimiter as unknown as {
  isUsingRedis: jest.Mock
}

const redisMock = {
  checkRedisHealth: checkRedisHealth as jest.MockedFunction<typeof checkRedisHealth>,
  isRedisConfigured: isRedisConfigured as jest.MockedFunction<typeof isRedisConfigured>,
}

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  __esModule: true,
  default: {
    isUsingRedis: jest.fn(),
  },
}))

jest.mock('@/lib/redis', () => ({
  __esModule: true,
  checkRedisHealth: jest.fn(),
  isRedisConfigured: jest.fn(),
}))

describe('Health and Readiness routes', () => {
  const env = process.env as Record<string, string | undefined>
  const originalNodeEnv = env.NODE_ENV

  beforeEach(() => {
    jest.clearAllMocks()
    env.NODE_ENV = 'production'
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }])
    rateLimiterMock.isUsingRedis.mockReturnValue(true)
    redisMock.isRedisConfigured.mockReturnValue(true)
  })

  afterAll(() => {
    env.NODE_ENV = originalNodeEnv
  })

  it('returns degraded health when Redis is down but the database is up', async () => {
    redisMock.checkRedisHealth.mockResolvedValue({
      connected: false,
      error: 'Redis timeout',
    })

    const response = await getHealth()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('degraded')
    expect(data.checks.database.status).toBe('up')
    expect(data.checks.redis.status).toBe('down')
    expect(data.checks.redis.mode).toBe('redis')
  })

  it('keeps readiness true when Redis is degraded but the database is up', async () => {
    redisMock.checkRedisHealth.mockResolvedValue({
      connected: false,
      error: 'Redis timeout',
    })

    const response = await getReadiness()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ready).toBe(true)
    expect(data.status).toBe('ready')
    expect(data.checks.database.status).toBe('up')
    expect(data.checks.redis.status).toBe('down')
  })

  it('returns not ready when the database is down', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('Database offline'))
    redisMock.checkRedisHealth.mockResolvedValue({
      connected: true,
      latencyMs: 12,
    })

    const response = await getReadiness()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.ready).toBe(false)
    expect(data.status).toBe('not_ready')
    expect(data.checks.database.status).toBe('down')
    expect(data.checks.redis.status).toBe('up')
  })
})
