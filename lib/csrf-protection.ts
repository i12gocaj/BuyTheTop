import { NextRequest, NextResponse } from 'next/server'

// Edge-compatible CSRF protection
// Using Web Crypto API for better Edge Runtime compatibility

/**
 * Generate a secure random token using Web Crypto API
 */
export async function generateCSRFToken(): Promise<string> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFToken(request: NextRequest, expectedToken: string): boolean {
  // Check token in header first (for AJAX requests)
  const headerToken = request.headers.get('x-csrf-token')
  if (headerToken && headerToken === expectedToken) {
    return true
  }

  // For form submissions, we'll validate in the API route
  return false
}

/**
 * Get CSRF token from cookies
 */
export function getCSRFTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get('csrf-token')?.value || null
}

/**
 * Set CSRF token in response cookies
 */
export function setCSRFTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  })
}

/**
 * Middleware function to handle CSRF protection
 */
export async function csrfProtection(request: NextRequest): Promise<NextResponse | null> {
  // Skip CSRF protection for safe methods and certain routes
  const method = request.method
  const pathname = request.nextUrl.pathname

  // Skip for GET, HEAD, OPTIONS and public API routes
  if (['GET', 'HEAD', 'OPTIONS'].includes(method) || 
      pathname.startsWith('/api/stats') || 
      pathname.startsWith('/api/rankings') ||
      pathname.startsWith('/api/webhooks/stripe')) {
    return null
  }

  // Skip for auth callback routes (handled by Supabase)
  if (pathname.startsWith('/auth/callback')) {
    return null
  }

  // For state-changing methods, we'll validate CSRF in individual API routes
  // This is more flexible than blocking in middleware
  return null
}

/**
 * Validate CSRF token in API route
 */
export async function validateCSRFInAPIRoute(request: NextRequest): Promise<boolean> {
  try {
    const csrfTokenFromCookie = getCSRFTokenFromCookies(request)
    
    if (!csrfTokenFromCookie) {
      return false
    }

    // Check if token is provided in header
    const csrfTokenFromHeader = request.headers.get('x-csrf-token')
    
    if (!csrfTokenFromHeader) {
      // For form submissions, check in form data
      if (request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
        const formData = await request.clone().formData()
        const csrfTokenFromForm = formData.get('csrf-token') as string
        return csrfTokenFromForm === csrfTokenFromCookie
      }
      
      // For JSON requests, check in body
      if (request.headers.get('content-type')?.includes('application/json')) {
        try {
          const body = await request.clone().json()
          return body.csrfToken === csrfTokenFromCookie
        } catch {
          return false
        }
      }
      
      return false
    }

    return csrfTokenFromHeader === csrfTokenFromCookie
  } catch (error) {
    console.error('CSRF validation error:', error)
    return false
  }
}

/**
 * API route helper to get/set CSRF token
 */
export async function handleCSRFToken(): Promise<NextResponse> {
  const token = await generateCSRFToken()
  const response = NextResponse.json({ csrfToken: token })
  setCSRFTokenCookie(response, token)
  return response
}
