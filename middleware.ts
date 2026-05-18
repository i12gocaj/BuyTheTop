import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Redirect from .pages.dev to custom domain
  if (request.nextUrl.hostname === 'buythetop.pages.dev') {
    const redirectUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, 'https://buythetop.vip')
    return NextResponse.redirect(redirectUrl, 301)
  }
  
  // Explicit bypass for password reset
  if (request.nextUrl.pathname === '/api/auth/send-password-reset') {
    return NextResponse.next()
  }
  
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/stats (stats API)
     * - api/rankings (rankings API)
     * - api/webhooks (webhook endpoints - no auth required)
     * - manifest.webmanifest
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|api/stats|api/rankings|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
