import { NextRequest } from 'next/server'

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export const rateLimitConfigs = {
  payment: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 payments per minute
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 auth attempts per 15 minutes
  search: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 searches per minute
  admin: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 admin actions per minute
  upload: { windowMs: 5 * 60 * 1000, maxRequests: 10 }, // 10 uploads per 5 minutes
  csrf: { windowMs: 60 * 1000, maxRequests: 100 } // 100 CSRF token requests per minute
} as const

export type RateLimitType = keyof typeof rateLimitConfigs

// In-memory store for rate limiting (for production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  // Fallback for development
  return 'localhost'
}

/**
 * Generate rate limit key
 */
function getRateLimitKey(identifier: string, type: RateLimitType): string {
  return `ratelimit:${type}:${identifier}`
}

/**
 * Check and update rate limit
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = rateLimitConfigs[type]
  const key = getRateLimitKey(identifier, type)
  const now = Date.now()
  
  // Clean up expired entries
  const entry = rateLimitStore.get(key)
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key)
  }
  
  // Get or create entry
  const current = rateLimitStore.get(key) || { 
    count: 0, 
    resetTime: now + config.windowMs 
  }
  
  // Check if limit exceeded
  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    }
  }
  
  // Increment counter
  current.count++
  rateLimitStore.set(key, current)
  
  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime
  }
}

/**
 * Enhanced rate limit check with user-based limiting
 */
export function checkRateLimitWithUser(
  ipIdentifier: string,
  userIdentifier: string | null,
  type: RateLimitType
): { allowed: boolean; remaining: number; resetTime: number; limitedBy: 'ip' | 'user' | null } {
  // Check IP-based rate limit
  const ipResult = checkRateLimit(ipIdentifier, type)
  
  // If no user identifier, return IP result
  if (!userIdentifier) {
    return { ...ipResult, limitedBy: ipResult.allowed ? null : 'ip' }
  }
  
  // Check user-based rate limit (more restrictive for some actions)
  const userMaxRequests = ['payment', 'upload', 'admin'].includes(type) 
    ? Math.ceil(rateLimitConfigs[type].maxRequests * 0.8)
    : rateLimitConfigs[type].maxRequests
  
  const userKey = getRateLimitKey(`user_${userIdentifier}`, type)
  const now = Date.now()
  
  // Clean up expired user entries
  const userEntry = rateLimitStore.get(userKey)
  if (userEntry && now > userEntry.resetTime) {
    rateLimitStore.delete(userKey)
  }
  
  // Get or create user entry
  const currentUser = rateLimitStore.get(userKey) || { 
    count: 0, 
    resetTime: now + rateLimitConfigs[type].windowMs 
  }
  
  // Check user limit
  if (currentUser.count >= userMaxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentUser.resetTime,
      limitedBy: 'user'
    }
  }
  
  // Check if IP limit is also OK
  if (!ipResult.allowed) {
    return { ...ipResult, limitedBy: 'ip' }
  }
  
  // Increment both counters
  currentUser.count++
  rateLimitStore.set(userKey, currentUser)
  
  return {
    allowed: true,
    remaining: Math.min(ipResult.remaining, userMaxRequests - currentUser.count),
    resetTime: Math.min(ipResult.resetTime, currentUser.resetTime),
    limitedBy: null
  }
}

/**
 * Rate limit middleware for requests
 */
export function rateLimit(type: RateLimitType) {
  return (request: NextRequest) => {
    const ip = getClientIP(request)
    const result = checkRateLimit(ip, type)
    
    if (!result.allowed) {
      const resetInSeconds = Math.ceil((result.resetTime - Date.now()) / 1000)
      throw new Error(`Rate limit exceeded. Try again in ${resetInSeconds} seconds.`)
    }
    
    return result
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number,
  limit: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString()
  }
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimit(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Note: In Cloudflare Workers, we can't use setInterval in global scope
// The cleanup is handled inline when checking rate limits
