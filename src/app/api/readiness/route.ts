/**
 * Readiness Check API Endpoint
 *
 * Indicates whether this instance is ready to serve traffic.
 * Unlike `/api/health`, this endpoint is intended for load balancer
 * and uptime probe gating and returns 503 when not ready.
 */

import { NextResponse } from 'next/server'
import { checkRedisHealth, isRedisConfigured } from '@/lib/redis'
import prisma from '@/lib/db'
import rateLimiter from '@/lib/rate-limit'

interface ReadinessStatus {
  ready: boolean
  status: 'ready' | 'not_ready'
  timestamp: string
  checks: {
    database: {
      status: 'up' | 'down'
      error?: string
    }
    redis: {
      status: 'up' | 'down' | 'not_configured'
      mode: 'redis' | 'in-memory'
      error?: string
    }
  }
}

async function checkDatabaseReady(): Promise<{
  status: 'up' | 'down'
  error?: string
}> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'up' }
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error',
    }
  }
}

/**
 * GET /api/readiness
 *
 * Returns 200 when this instance is ready to serve traffic,
 * otherwise returns 503.
 */
export async function GET(): Promise<NextResponse<ReadinessStatus>> {
  const timestamp = new Date().toISOString()
  const exposeInternalErrors = process.env.NODE_ENV !== 'production'

  const [databaseReady, redisHealth] = await Promise.all([
    checkDatabaseReady(),
    checkRedisHealth(),
  ])

  const redisConfigured = isRedisConfigured()
  const usingRedis = rateLimiter.isUsingRedis()

  const databaseStatus: ReadinessStatus['checks']['database'] = {
    status: databaseReady.status,
    error: databaseReady.error
      ? exposeInternalErrors
        ? databaseReady.error
        : 'Database unavailable'
      : undefined,
  }

  const redisStatus: ReadinessStatus['checks']['redis'] = {
    status: redisConfigured
      ? redisHealth.connected
        ? 'up'
        : 'down'
      : 'not_configured',
    mode: usingRedis ? 'redis' : 'in-memory',
    error: redisHealth.error
      ? exposeInternalErrors
        ? redisHealth.error
        : 'Redis unavailable'
      : undefined,
  }

  // Database is required. Redis is required only when explicitly configured.
  const ready =
    databaseStatus.status === 'up' &&
    (!redisConfigured || redisStatus.status === 'up')

  const body: ReadinessStatus = {
    ready,
    status: ready ? 'ready' : 'not_ready',
    timestamp,
    checks: {
      database: databaseStatus,
      redis: redisStatus,
    },
  }

  return NextResponse.json(body, {
    status: ready ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
