import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

// Auth response interface
export interface AuthResult {
  user: User | null
  isAuthenticated: boolean
  isAdmin?: boolean
  role?: string
  error?: string
}

// Create Supabase client for server-side auth
function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Verificar autenticación usando cookies de Supabase
export async function verifyAuthFromCookies(request: NextRequest): Promise<AuthResult> {
  try {
    // Obtener cookies de Supabase
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      return { user: null, isAuthenticated: false, error: 'No cookies provided' }
    }

    // Buscar la cookie de auth de Supabase
    const authCookieMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/)
    if (!authCookieMatch) {
      return { user: null, isAuthenticated: false, error: 'No auth cookie found' }
    }

    const authCookie = decodeURIComponent(authCookieMatch[1])
    let session
    
    try {
      session = JSON.parse(authCookie)
    } catch {
      return { user: null, isAuthenticated: false, error: 'Invalid cookie format' }
    }

    if (!session.access_token) {
      return { user: null, isAuthenticated: false, error: 'No access token' }
    }

    const supabase = createAuthClient()
    
    const { data: { user }, error } = await supabase.auth.getUser(session.access_token)
    
    if (error || !user) {
      return { user: null, isAuthenticated: false, error: 'Invalid token' }
    }

    // Obtener role desde la tabla user_profiles
    const { data: profile, error: _profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'user'
    const isAdmin = role === 'admin'

    return { 
      user, 
      isAuthenticated: true, 
      isAdmin,
      role 
    }
  } catch (error) {
    return { user: null, isAuthenticated: false, error: 'Auth check failed' }
  }
}

// Verificar autenticación y obtener role desde user_profiles (Legacy - usando Authorization header)
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      // Si no hay Authorization header, intentar con cookies
      return verifyAuthFromCookies(request)
    }

    const token = authHeader.substring(7)
    const supabase = createAuthClient()
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, isAuthenticated: false, error: 'Invalid token' }
    }

    // Obtener role desde la tabla user_profiles
    const { data: profile, error: _profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const role = profile?.role || 'user'
    const isAdmin = role === 'admin'

    return { 
      user, 
      isAuthenticated: true, 
      isAdmin,
      role 
    }
  } catch (error) {
    return { user: null, isAuthenticated: false, error: 'Auth check failed' }
  }
}

// Middleware para requerir autenticación
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const result = await verifyAuth(request)
  
  if (!result.isAuthenticated) {
    throw new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return result
}

// Middleware para requerir admin
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const result = await requireAuth(request)
  
  if (!result.isAdmin) {
    throw new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return result
}

// Función helper para obtener user desde cookies (para pages)
export async function getUserFromCookies(cookieHeader: string | null): Promise<AuthResult> {
  if (!cookieHeader) {
    return { user: null, isAuthenticated: false }
  }

  try {
    const supabase = createAuthClient()
    
    // Parse session from cookie
    const sessionMatch = cookieHeader.match(/supabase-auth-token=([^;]+)/)
    if (!sessionMatch) {
      return { user: null, isAuthenticated: false }
    }

    const sessionData = decodeURIComponent(sessionMatch[1])
    const session = JSON.parse(sessionData)
    
    const { data: { user }, error } = await supabase.auth.getUser(session.access_token)
    
    if (error || !user) {
      return { user: null, isAuthenticated: false }
    }

    // Obtener role desde la tabla user_profiles
    const { data: profile, error: _profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const role = profile?.role || 'user'
    const isAdmin = role === 'admin'

    return { 
      user, 
      isAuthenticated: true, 
      isAdmin,
      role 
    }
  } catch {
    return { user: null, isAuthenticated: false }
  }
}

// Helper para Response con error
export function createErrorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Helper para Response con éxito
export function createSuccessResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
