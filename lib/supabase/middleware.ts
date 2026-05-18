import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { logSecurityEvent } from '@/lib/security-logger'
import { hasRecentSuspiciousActivity } from '@/lib/security-logger'

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export async function updateSession(request: NextRequest) {
  // If Supabase is not configured, just continue without auth
  if (!isSupabaseConfigured) {
    return NextResponse.next({
      request,
    })
  }

  // Check for suspicious activity first
  const { pathname } = request.nextUrl
  
  // Explicit bypass for password reset endpoint
  if (pathname === '/api/auth/send-password-reset') {
    console.log('🔄 Middleware: Explicit bypass for send-password-reset')
    return NextResponse.next()
  }
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'localhost'

  if (hasRecentSuspiciousActivity(clientIP)) {
    logSecurityEvent('suspicious_activity', request, {
      reason: 'IP flagged for recent suspicious activity'
    }, 'high')
    
    // For critical paths, block completely
    if (pathname.startsWith('/api/admin/') || 
        pathname.startsWith('/api/upload-') ||
        pathname.startsWith('/api/payment')) {
      return NextResponse.json(
        { error: 'Access temporarily restricted due to suspicious activity' }, 
        { status: 429 }
      )
    }
  }

  // Skip middleware for static files, APIs (except auth and user-specific), and some system routes
  const shouldSkip = (
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.webmanifest' ||
    pathname.startsWith('/api/stats') ||
    pathname.startsWith('/api/rankings') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/signin') ||
    pathname.startsWith('/api/auth/sign-up') ||
    pathname.startsWith('/api/auth/signout') ||
    pathname.startsWith('/api/auth/forgot-password') ||
    pathname.startsWith('/api/auth/send-password-reset') ||
    pathname.startsWith('/api/auth/confirm-account') ||
    pathname.startsWith('/api/auth/confirm-email-change') ||
    pathname.startsWith('/api/auth/send-confirmation')
  )
  
  if (shouldSkip) {
    console.log('🔄 Middleware: Skipping auth check for:', pathname)
    return NextResponse.next()
  }
  
  console.log('🔄 Middleware: Processing auth for:', pathname)

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Check URL parameters once
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const isRecoveryFlow = type === "recovery" || (code && requestUrl.pathname === '/auth/reset-password')

  // Only get user if we really need auth (not for public API routes or recovery flow)
  let user = null
  
  if (!isRecoveryFlow) {
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
      
      // Check email confirmation for authenticated users (except on auth routes and change-email)
      if (user && !pathname.startsWith('/auth/') && !pathname.startsWith('/api/auth/') && pathname !== '/api/change-email') {
        try {
          const { data: confirmationData, error: confirmationError } = await supabase
            .from('email_confirmations')
            .select('confirmed_at')
            .eq('user_id', user.id)
            .single()

          if (confirmationError && confirmationError.code !== 'PGRST116') {
            console.warn('Middleware: Error checking email confirmation:', confirmationError)
            // Continue with normal flow
          } else if (confirmationData && !confirmationData.confirmed_at) {
            console.log('Middleware: User has unconfirmed email, signing out')
            // Sign out the user and redirect to login
            await supabase.auth.signOut()
            const loginUrl = new URL("/auth/login", request.url)
            loginUrl.searchParams.set("error", "email_not_confirmed")
            loginUrl.searchParams.set("message", "Please confirm your email address before accessing the site.")
            return NextResponse.redirect(loginUrl)
          }
        } catch (emailCheckError) {
          console.warn('Middleware: Exception checking email confirmation:', emailCheckError)
          // Continue with normal flow
        }
      }
    } catch (error) {
      // Silently handle auth errors - user stays null
      console.warn('Auth error (ignoring):', error instanceof Error ? error.message : 'Unknown auth error')
    }
  } else {
    console.log('🔄 Recovery flow detected - skipping user session check to prevent auto-login')
  }
  
  // Only log for auth-related routes
  if (requestUrl.pathname.startsWith('/auth/')) {
    const allParams = Object.fromEntries(requestUrl.searchParams.entries())
    console.log('🔄 Auth Middleware - URL:', request.url)
    console.log('🔄 Auth Middleware - All params:', allParams)
    console.log('🔄 Auth Middleware - Path:', requestUrl.pathname)
  }

  // Handle auth callback specifically
  if (requestUrl.pathname === '/auth/callback' && code) {
    console.log('🔄 Auth callback detected:', { type, hasCode: !!code })
    
    // For password recovery, redirect to reset password page WITHOUT exchanging code
    if (type === "recovery") {
      console.log('🔄 Password recovery redirect (explicit type) - NOT exchanging code')
      const redirectUrl = new URL("/auth/reset-password", request.url)
      
      // Pass through all the original query parameters
      requestUrl.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value)
      })
      
      console.log('🔄 Redirecting to:', redirectUrl.toString())
      return NextResponse.redirect(redirectUrl)
    }
    
    // For email change, redirect to confirm email change page WITHOUT exchanging code
    if (type === "email_change") {
      console.log('🔄 Email change redirect (explicit type) - NOT exchanging code')
      const redirectUrl = new URL("/auth/confirm-email-change", request.url)
      
      // Pass through all the original query parameters
      requestUrl.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value)
      })
      
      console.log('🔄 Redirecting to:', redirectUrl.toString())
      return NextResponse.redirect(redirectUrl)
    }
    
    // For regular auth (login/signup), exchange code for session
    console.log('🔄 Regular auth - exchanging code for session')
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('🔄 Error exchanging code:', error)
      return NextResponse.redirect(new URL("/auth/login?error=auth_failed", request.url))
    }
    
    console.log('🔄 Regular auth redirect to home')
    // Redirect to home page after successful auth
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/", 
    "/help", 
    "/terms", 
    "/privacy",
    "/contact",
    "/ranking", 
    "/auth/login", 
    "/auth/sign-up", 
    "/auth/callback", 
    "/auth/confirm",
    "/auth/confirm-email-change",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/api/rankings", 
    "/api/contact",
    "/api/auth/login",
    "/api/auth/signin", 
    "/api/auth/sign-up",
    "/api/auth/signout", 
    "/api/auth/forgot-password",
    "/api/auth/send-password-reset",
    "/api/auth/confirm-account",
    "/api/auth/confirm-email-change",
    "/api/auth/send-confirmation",
    "/profile", 
    "/contribute", 
    "/api/update-profile-v2"
  ]

  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + "/"),
  )

  // For API routes that aren't public, return 401 instead of redirect
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  
  if (isApiRoute && !isPublicRoute && !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // If not a public route and no user, redirect to login (only for non-API routes)
  if (!isPublicRoute && !user && !isApiRoute) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // For admin routes, check user role
  if (request.nextUrl.pathname.startsWith('/api/admin/')) {
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verificación de rol específica se hace en cada endpoint
  }

  return supabaseResponse
}
