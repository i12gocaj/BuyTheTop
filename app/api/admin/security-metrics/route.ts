export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSecurityMetrics, getRecentSecurityEvents } from '@/lib/security-logger'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

/**
 * GET /api/admin/security-metrics
 * Returns security metrics and recent events for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'localhost'
    
    const rateLimitResult = checkRateLimit(clientIP, 'admin')
    
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
      
      const headers = getRateLimitHeaders(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
        20
      )
      
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    }

    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get security metrics and recent events
    const metrics = getSecurityMetrics()
    const recentEvents = getRecentSecurityEvents(50)

    const response = NextResponse.json({
      metrics,
      recentEvents: recentEvents.map(event => ({
        ...event,
        // Hide sensitive details for frontend display
        details: {
          ...event.details,
          ip: event.ip.replace(/\.\d+$/, '.xxx') // Partially mask IP
        }
      }))
    })

    // Add rate limit headers
    const headers = getRateLimitHeaders(
      rateLimitResult.remaining,
      rateLimitResult.resetTime,
      20
    )
    
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response

  } catch (error) {
    console.error('Security metrics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
