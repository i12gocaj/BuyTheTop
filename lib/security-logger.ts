import { NextRequest } from 'next/server'

// Security event types
export type SecurityEventType = 
  | 'auth_failure'
  | 'rate_limit_exceeded' 
  | 'file_upload_rejected'
  | 'admin_access_denied'
  | 'csrf_validation_failed'
  | 'suspicious_activity'
  | 'malicious_content_detected'

// Security event interface
export interface SecurityEvent {
  type: SecurityEventType
  timestamp: string
  ip: string
  userAgent?: string
  userId?: string
  email?: string
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// In-memory store for security events (in production, use a proper logging service)
const securityEvents: SecurityEvent[] = []
const MAX_EVENTS = 1000 // Keep last 1000 events in memory

/**
 * Log a security event
 */
export function logSecurityEvent(
  type: SecurityEventType,
  request: NextRequest,
  details: Record<string, any> = {},
  severity: SecurityEvent['severity'] = 'medium',
  userId?: string,
  email?: string
): void {
  const event: SecurityEvent = {
    type,
    timestamp: new Date().toISOString(),
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent') || undefined,
    userId,
    email,
    details: {
      url: request.url,
      method: request.method,
      ...details
    },
    severity
  }

  // Add to in-memory store
  securityEvents.push(event)
  
  // Keep only recent events
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.shift()
  }

  // In production, also send to external logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to logging service (e.g., DataDog, LogRocket, etc.)
    console.warn('Security Event:', JSON.stringify(event))
  } else {
    console.log('Security Event:', event)
  }
}

/**
 * Get client IP from request
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
  
  return 'localhost'
}

/**
 * Get recent security events (for admin dashboard)
 */
export function getRecentSecurityEvents(limit: number = 50): SecurityEvent[] {
  return securityEvents
    .slice(-limit)
    .reverse() // Most recent first
}

/**
 * Get security events by type
 */
export function getSecurityEventsByType(
  type: SecurityEventType, 
  limit: number = 50
): SecurityEvent[] {
  return securityEvents
    .filter(event => event.type === type)
    .slice(-limit)
    .reverse()
}

/**
 * Get security events by IP
 */
export function getSecurityEventsByIP(
  ip: string, 
  limit: number = 50
): SecurityEvent[] {
  return securityEvents
    .filter(event => event.ip === ip)
    .slice(-limit)
    .reverse()
}

/**
 * Check if IP has suspicious activity
 */
export function hasRecentSuspiciousActivity(
  ip: string, 
  timeWindowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const cutoff = new Date(Date.now() - timeWindowMs).toISOString()
  
  const recentEvents = securityEvents.filter(event => 
    event.ip === ip && 
    event.timestamp > cutoff &&
    ['high', 'critical'].includes(event.severity)
  )
  
  return recentEvents.length >= 3 // 3 or more high/critical events in window
}

/**
 * Clear old security events (call periodically)
 */
export function clearOldSecurityEvents(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
  const cutoff = new Date(Date.now() - maxAgeMs).toISOString()
  const validEvents = securityEvents.filter(event => event.timestamp > cutoff)
  
  // Clear and replace with valid events
  securityEvents.length = 0
  securityEvents.push(...validEvents)
}

/**
 * Security metrics for monitoring
 */
export function getSecurityMetrics(): {
  totalEvents: number
  eventsByType: Record<SecurityEventType, number>
  eventsBySeverity: Record<SecurityEvent['severity'], number>
  uniqueIPs: number
  recentActivity: number // Events in last hour
} {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  const eventsByType = {} as Record<SecurityEventType, number>
  const eventsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 }
  const uniqueIPs = new Set<string>()
  let recentActivity = 0

  securityEvents.forEach(event => {
    // Count by type
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
    
    // Count by severity
    eventsBySeverity[event.severity]++
    
    // Track unique IPs
    uniqueIPs.add(event.ip)
    
    // Count recent activity
    if (event.timestamp > oneHourAgo) {
      recentActivity++
    }
  })

  return {
    totalEvents: securityEvents.length,
    eventsByType,
    eventsBySeverity,
    uniqueIPs: uniqueIPs.size,
    recentActivity
  }
}
