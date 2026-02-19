/**
 * Health Check API Endpoint
 *
 * Provides health status for the application including:
 * - Overall application health
 * - Database connectivity
 * - Redis connectivity (for rate limiting)
 *
 * This endpoint is NOT protected by authentication to allow
 * load balancers and monitoring systems to check health.
 */

import { NextResponse } from 'next/server'
import { checkRedisHealth, isRedisConfigured } from '@/lib/redis'
import prisma from '@/lib/db'
import rateLimiter from '@/lib/rate-limit'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: {
      status: 'up' | 'down'
      latencyMs?: number
      error?: string
    }
    redis: {
      status: 'up' | 'down' | 'not_configured'
      latencyMs?: number
      error?: string
      mode: 'redis' | 'in-memory'
    }
  }
}

// Track server start time for uptime calculation
const startTime = Date.now()

/**
 * Check database connectivity
 */
async function checkDatabaseHealth(): Promise<{
  status: 'up' | 'down'
  latencyMs?: number
  error?: string
}> {
  try {
    const start = Date.now()
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`
    const latencyMs = Date.now() - start

    return {
      status: 'up',
      latencyMs,
    }
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error',
    }
  }
}

/**
 * GET /api/health
 *
 * Returns health status of the application and its dependencies.
 *
 * Response format:
 * {
 *   "status": "healthy" | "degraded" | "unhealthy",
 *   "timestamp": "2025-01-01T00:00:00.000Z",
 *   "version": "0.1.0",
 *   "uptime": 12345,
 *   "checks": {
 *     "database": { "status": "up", "latencyMs": 5 },
 *     "redis": { "status": "up", "latencyMs": 10, "mode": "redis" }
 *   }
 * }
 */
export async function GET(): Promise<NextResponse<HealthStatus>> {
  const timestamp = new Date().toISOString()
  const uptime = Math.floor((Date.now() - startTime) / 1000)
  const exposeInternalErrors = process.env.NODE_ENV !== 'production'

  // Run health checks in parallel
  const [databaseHealth, redisHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ])

  const databaseStatus: HealthStatus['checks']['database'] = {
    status: databaseHealth.status,
    latencyMs: databaseHealth.latencyMs,
    error: databaseHealth.error
      ? exposeInternalErrors
        ? databaseHealth.error
        : 'Database unavailable'
      : undefined,
  }

  // Determine Redis status and mode
  const redisConfigured = isRedisConfigured()
  const usingRedis = rateLimiter.isUsingRedis()

  const redisStatus: HealthStatus['checks']['redis'] = {
    status: redisConfigured
      ? redisHealth.connected
        ? 'up'
        : 'down'
      : 'not_configured',
    latencyMs: redisHealth.latencyMs,
    error: redisHealth.error
      ? exposeInternalErrors
        ? redisHealth.error
        : 'Redis unavailable'
      : undefined,
    mode: usingRedis ? 'redis' : 'in-memory',
  }

  // Determine overall health status
  let overallStatus: HealthStatus['status'] = 'healthy'

  // Database is critical - if down, we're unhealthy
  if (databaseStatus.status === 'down') {
    overallStatus = 'unhealthy'
  }
  // Redis down in production (when configured) means degraded
  else if (redisConfigured && redisHealth.connected === false) {
    overallStatus = 'degraded'
  }
  // Using in-memory in production is degraded
  else if (
    process.env.NODE_ENV === 'production' &&
    !usingRedis
  ) {
    overallStatus = 'degraded'
  }

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp,
    version: process.env.npm_package_version || '0.1.0',
    uptime,
    checks: {
      database: databaseStatus,
      redis: redisStatus,
    },
  }

  // Return appropriate HTTP status code
  const httpStatus =
    overallStatus === 'healthy'
      ? 200
      : overallStatus === 'degraded'
        ? 200 // Still return 200 for degraded to keep load balancers happy
        : 503 // Service Unavailable for unhealthy

  return NextResponse.json(healthStatus, { status: httpStatus })
}
