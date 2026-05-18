export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 DEBUG: Starting confirmation process...')
    
    const body = await request.json()
    console.log('🔧 DEBUG: Body received:', body)
    
    const { token, type } = body
    
    if (!token || !type) {
      return NextResponse.json({ error: "Missing token or type" }, { status: 400 })
    }
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔧 DEBUG: Supabase URL exists:', !!supabaseUrl)
    console.log('🔧 DEBUG: Supabase Key exists:', !!supabaseAnonKey)
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 })
    }
    
    // Crear cliente
    console.log('🔧 DEBUG: Creating Supabase client...')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Decodificar token
    console.log('🔧 DEBUG: Decoding token...')
    let email: string
    try {
      const decoded = Buffer.from(token, 'base64url').toString()
      const [tokenEmail, timestamp] = decoded.split(':')
      email = tokenEmail
      console.log('🔧 DEBUG: Token decoded successfully, email:', email)
    } catch (error) {
      console.error('🔧 DEBUG: Token decode failed:', error)
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 })
    }
    
    // Probar una consulta simple
    console.log('🔧 DEBUG: Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('email_confirmations')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('🔧 DEBUG: Database connection failed:', testError)
      return NextResponse.json({ 
        error: "Database connection failed", 
        details: testError.message 
      }, { status: 500 })
    }
    
    console.log('🔧 DEBUG: Database connection successful')
    
    // Buscar el registro de confirmación
    console.log('🔧 DEBUG: Looking for confirmation record for email:', email)
    const { data: confirmationData, error: findError } = await supabase
      .from('email_confirmations')
      .select('*')
      .eq('email', email)
      .single()
    
    if (findError) {
      console.error('🔧 DEBUG: Error finding confirmation record:', findError)
      return NextResponse.json({ 
        error: "Error finding confirmation record", 
        details: findError.message 
      }, { status: 500 })
    }
    
    console.log('🔧 DEBUG: Confirmation record found:', confirmationData)
    
    if (confirmationData?.confirmed_at) {
      return NextResponse.json({ 
        alreadyConfirmed: true,
        message: "Account already confirmed"
      })
    }
    
    // Actualizar registro
    console.log('🔧 DEBUG: Updating confirmation record...')
    const { error: updateError } = await supabase
      .from('email_confirmations')
      .update({ confirmed_at: new Date().toISOString() })
      .eq('email', email)
    
    if (updateError) {
      console.error('🔧 DEBUG: Error updating confirmation:', updateError)
      return NextResponse.json({ 
        error: "Error updating confirmation", 
        details: updateError.message 
      }, { status: 500 })
    }
    
    console.log('🔧 DEBUG: Confirmation successful!')
    
    // Enviar email de bienvenida
    console.log('📧 DEBUG: Sending welcome email...')
    try {
      const { emailService } = await import('@/lib/email/service')
      const displayName = email.split('@')[0]
      
      const welcomeResult = await emailService.sendWelcomeEmail({
        to: email,
        name: displayName
      })
      
      if (welcomeResult.success) {
        console.log('📧 DEBUG: Welcome email sent successfully')
      } else {
        console.error('📧 DEBUG: Failed to send welcome email:', welcomeResult.error)
        // No fallar la confirmación por un error en el email de bienvenida
      }
    } catch (emailError) {
      console.error('📧 DEBUG: Exception sending welcome email:', emailError)
      // No fallar la confirmación por un error en el email de bienvenida
    }
    
    return NextResponse.json({ 
      success: "Account confirmed successfully!",
      email: email
    })
    
  } catch (error) {
    console.error('🔧 DEBUG: Unexpected error:', error)
    return NextResponse.json({ 
      error: "Unexpected error", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
