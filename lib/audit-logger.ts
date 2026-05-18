import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

// Audit log types
export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'PAYMENT_CREATED' 
  | 'PAYMENT_COMPLETED' 
  | 'ADMIN_ACCESS' 
  | 'PROFILE_UPDATED' 
  | 'RATE_LIMIT_HIT'
  | 'AUTH_FAILED'
  | 'VALIDATION_FAILED'

export interface AuditLogEntry {
  userId?: string
  action: AuditAction
  resourceType?: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

// Create Supabase client for logging
function createAuditClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    if (!process.env.ENABLE_AUDIT_LOGS || process.env.ENABLE_AUDIT_LOGS !== 'true') {
      return
    }

    const supabase = createAuditClient()
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: entry.userId || null,
        action: entry.action,
        resource_type: entry.resourceType || null,
        resource_id: entry.resourceId || null,
        details: entry.details || null,
        ip_address: entry.ipAddress || null,
        user_agent: entry.userAgent || null
      })

    if (error) {
      console.error('Failed to log audit event:', error)
    }
  } catch (error) {
    console.error('Error logging audit event:', error)
  }
}

/**
 * Extract IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('x-vercel-forwarded-for')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (remoteAddr) {
    return remoteAddr.split(',')[0].trim()
  }
  
  return 'unknown'
}

/**
 * Create audit log entry from request
 */
export function createAuditEntry(
  request: NextRequest,
  action: AuditAction,
  userId?: string,
  additionalData?: Partial<AuditLogEntry>
): AuditLogEntry {
  return {
    userId,
    action,
    ipAddress: getClientIP(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
    ...additionalData
  }
}

/**
 * Middleware to log authentication events
 */
export async function logAuthEvent(
  request: NextRequest,
  action: 'LOGIN' | 'LOGOUT' | 'AUTH_FAILED',
  userId?: string,
  details?: Record<string, any>
): Promise<void> {
  const entry = createAuditEntry(request, action, userId, {
    resourceType: 'auth',
    details
  })
  
  await logAuditEvent(entry)
}

/**
 * Middleware to log payment events
 */
export async function logPaymentEvent(
  request: NextRequest,
  action: 'PAYMENT_CREATED' | 'PAYMENT_COMPLETED',
  userId: string,
  paymentId: string,
  amount?: number
): Promise<void> {
  const entry = createAuditEntry(request, action, userId, {
    resourceType: 'payment',
    resourceId: paymentId,
    details: { amount }
  })
  
  await logAuditEvent(entry)
}

/**
 * Middleware to log admin access
 */
export async function logAdminAccess(
  request: NextRequest,
  userId: string,
  endpoint: string
): Promise<void> {
  const entry = createAuditEntry(request, 'ADMIN_ACCESS', userId, {
    resourceType: 'admin_endpoint',
    resourceId: endpoint,
    details: { 
      method: request.method,
      url: request.url
    }
  })
  
  await logAuditEvent(entry)
}

/**
 * Middleware to log rate limit hits
 */
export async function logRateLimitHit(
  request: NextRequest,
  limitType: string,
  userId?: string
): Promise<void> {
  const entry = createAuditEntry(request, 'RATE_LIMIT_HIT', userId, {
    resourceType: 'rate_limit',
    resourceId: limitType,
    details: { 
      endpoint: request.nextUrl.pathname
    }
  })
  
  await logAuditEvent(entry)
}

/**
 * Console logging for development
 */
export function logSecurityEvent(
  level: 'info' | 'warn' | 'error',
  message: string,
  details?: any
): void {
  const timestamp = new Date().toISOString()
  const logLevel = process.env.LOG_LEVEL || 'info'
  
  const shouldLog = (
    logLevel === 'info' ||
    (logLevel === 'warn' && ['warn', 'error'].includes(level)) ||
    (logLevel === 'error' && level === 'error')
  )
  
  if (!shouldLog) {
    return
  }
  
  const logData = {
    timestamp,
    level,
    message,
    details: process.env.NODE_ENV === 'development' ? details : undefined
  }
  
  switch (level) {
    case 'error':
      console.error('🚨 SECURITY:', JSON.stringify(logData, null, 2))
      break
    case 'warn':
      console.warn('⚠️ SECURITY:', JSON.stringify(logData, null, 2))
      break
    case 'info':
      console.info('ℹ️ SECURITY:', JSON.stringify(logData, null, 2))
      break
  }
}
