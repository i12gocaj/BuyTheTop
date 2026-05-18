export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 DEBUG LOGIN: Starting authentication process...')
    
    const { email, password } = await request.json()
    console.log('📧 DEBUG LOGIN: Email received:', email)

    if (!email || !password) {
      console.error('❌ DEBUG LOGIN: Missing email or password')
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔧 DEBUG LOGIN: Supabase URL exists:', !!supabaseUrl)
    console.log('🔧 DEBUG LOGIN: Supabase Anon Key exists:', !!supabaseAnonKey)
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ DEBUG LOGIN: Missing Supabase environment variables')
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 }
      )
    }

    // Crear cliente del servidor (con cookies)
    console.log('🔑 DEBUG LOGIN: Creating server Supabase client with cookies...')
    const supabase = await createClient()
    
    console.log('✅ DEBUG LOGIN: Supabase server client created successfully')
    
    // Verificar si es un cliente dummy
    if (!supabase || typeof supabase.auth.signInWithPassword !== 'function') {
      console.error('❌ DEBUG LOGIN: Received dummy client - falling back to direct client')
      const { createClient: createDirectClient } = await import("@supabase/supabase-js")
      const directSupabase = createDirectClient(supabaseUrl!, supabaseAnonKey!)
      
      console.log('🔑 DEBUG LOGIN: Using direct client instead...')
      
      // Usar cliente directo
      const { data, error } = await directSupabase.auth.signInWithPassword({
        email: email.toString(),
        password: password.toString(),
      })
      
      console.log('🔑 DEBUG LOGIN: Direct client auth response:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasError: !!error,
        errorMessage: error?.message
      })
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      
      if (!data.user) {
        return NextResponse.json({ error: "No user data returned" }, { status: 401 })
      }
      
      // Para cliente directo, no podemos manejar cookies automáticamente
      return NextResponse.json({
        success: "Login successful with direct client",
        user: { id: data.user.id, email: data.user.email },
        note: "Session may not persist - using direct client"
      })
    }
    
    // Intentar login
    console.log('🔑 DEBUG LOGIN: Attempting signInWithPassword...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    console.log('🔑 DEBUG LOGIN: Supabase auth response:', {
      hasData: !!data,
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.code
    })

    if (error) {
      console.error('🔑 DEBUG LOGIN: Supabase auth error:', error)
      return NextResponse.json({
        error: error.message,
        code: error.code,
        details: error
      }, { status: 401 })
    }

    if (!data.user) {
      console.error('🔑 DEBUG LOGIN: No user data returned')
      return NextResponse.json({ error: "No user data returned" }, { status: 401 })
    }

    console.log('✅ DEBUG LOGIN: User authenticated successfully:', {
      userId: data.user.id,
      email: data.user.email,
      emailConfirmed: data.user.email_confirmed_at
    })
    
    // Verificar confirmación en nuestra tabla personalizada
    console.log('🔑 DEBUG LOGIN: Checking custom email confirmation...')
    try {
      const { data: confirmationData, error: confirmationError } = await supabase
        .from('email_confirmations')
        .select('confirmed_at, user_id, email')
        .eq('user_id', data.user.id)
        .single()

      console.log('🔑 DEBUG LOGIN: Confirmation query result:', {
        hasData: !!confirmationData,
        hasError: !!confirmationError,
        errorCode: confirmationError?.code,
        errorMessage: confirmationError?.message,
        confirmedAt: confirmationData?.confirmed_at
      })

      if (confirmationError && confirmationError.code !== 'PGRST116') {
        console.error('🔑 DEBUG LOGIN: Error checking email confirmation:', confirmationError)
        // Continuar con el login aunque no podamos verificar
      } else if (confirmationData) {
        if (!confirmationData.confirmed_at) {
          console.log('🔑 DEBUG LOGIN: Email NOT confirmed, signing out and blocking login')
          
          // Sign out the user since session was already created
          await supabase.auth.signOut()
          
          return NextResponse.json({
            error: "Please confirm your email address before signing in. Check your inbox for a confirmation link.",
            emailNotConfirmed: true
          }, { status: 401 })
        } else {
          console.log('🔑 DEBUG LOGIN: Email confirmed at:', confirmationData.confirmed_at)
        }
      } else {
        console.log('🔑 DEBUG LOGIN: No confirmation record found - assuming legacy user, allowing login')
      }
    } catch (confirmationCheckError) {
      console.error('🔑 DEBUG LOGIN: Exception checking email confirmation:', confirmationCheckError)
      // Continuar con el login en caso de error
    }
    
    console.log('✅ DEBUG LOGIN: Authentication successful!')
    
    return NextResponse.json({
      success: "Login successful",
      user: {
        id: data.user.id,
        email: data.user.email
      }
    })
    
  } catch (error) {
    console.error('🔑 DEBUG LOGIN: Unexpected error:', error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
