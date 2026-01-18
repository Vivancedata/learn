/**
 * Authentication utilities using JWT tokens
 * Provides token generation, verification, and user session management
 */

import { SignJWT, jwtVerify } from 'jose'
import type { JWTPayload as JoseJWTPayload } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { ForbiddenError } from './api-errors'

// JWT configuration
const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required. Generate one with: openssl rand -base64 32')
}
const JWT_SECRET = new TextEncoder().encode(jwtSecret)
const JWT_ALGORITHM = 'HS256'
const TOKEN_EXPIRATION = '7d' // 7 days

export type UserRole = 'student' | 'instructor' | 'admin'

export interface JWTPayload extends JoseJWTPayload {
  userId: string
  email: string
  name?: string
  role: UserRole
}

export interface AuthSession {
  userId: string
  email: string
  name?: string
  role: UserRole
}

/**
 * Generate a JWT token for a user
 * @param payload - User data to encode in the token
 * @returns JWT token string
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Compare a password with a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Set authentication cookie with JWT token
 * @param token - JWT token string
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

/**
 * Get authentication token from cookies
 * @returns JWT token string or null
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('auth-token')
  return cookie?.value || null
}

/**
 * Remove authentication cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

/**
 * Get current authenticated user from cookies
 * @returns User session or null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthSession | null> {
  const token = await getAuthToken()

  if (!token) {
    return null
  }

  const payload = await verifyToken(token)

  if (!payload) {
    return null
  }

  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  }
}

/**
 * Get authenticated user from request
 * Checks both cookies and Authorization header
 * @param request - Next.js request object
 * @returns User session or null if not authenticated
 */
export async function getAuthUser(
  request: NextRequest
): Promise<AuthSession | null> {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (payload) {
      return {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      }
    }
  }

  // Fallback to cookie
  const cookieStore = await cookies()
  const cookie = cookieStore.get('auth-token')

  if (cookie?.value) {
    const payload = await verifyToken(cookie.value)

    if (payload) {
      return {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      }
    }
  }

  return null
}

/**
 * Check if user has required role
 * @param userRole - User's current role
 * @param requiredRoles - Array of required roles
 * @returns True if user has one of the required roles
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Require specific role - throws ForbiddenError if user doesn't have required role
 * @param request - Next.js request object
 * @param requiredRoles - Array of required roles
 * @returns Authenticated user session
 * @throws UnauthorizedError if not authenticated, ForbiddenError if wrong role
 */
export async function requireRole(
  request: NextRequest,
  requiredRoles: UserRole[]
): Promise<AuthSession> {
  const user = await requireAuth(request)

  if (!hasRole(user.role, requiredRoles)) {
    throw new ForbiddenError(`Requires one of: ${requiredRoles.join(', ')}`)
  }

  return user
}

/**
 * Require authentication - throws UnauthorizedError if not authenticated
 * Use this in API routes that require authentication
 * @param request - Next.js request object
 * @returns Authenticated user session
 * @throws UnauthorizedError if not authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthSession> {
  const user = await getAuthUser(request)

  if (!user) {
    throw new Error('Unauthorized - Please sign in')
  }

  return user
}

/**
 * Get user ID from request headers (set by middleware)
 * @param request - Next.js request object
 * @returns User ID string or null if not authenticated
 */
export function getUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id')
}
