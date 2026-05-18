export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { emailService } from '@/lib/email/service'
import { z } from 'zod'

// Schema de validación
const SendConfirmationSchema = z.object({
  email: z.string().email('Invalid email format')
})

// Create admin client
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Send Confirmation: Starting request...')
    
    const body = await request.json()
    const validation = SendConfirmationSchema.safeParse(body)
    
    if (!validation.success) {
      const errorMessage = validation.error.errors.map(e => e.message).join(', ')
      console.error('📧 Validation failed:', errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { email } = validation.data
    
    // Crear cliente admin de Supabase
    const supabase = createAdminClient()

    // Verificar si el usuario existe usando Admin API
    const { data: users, error: fetchError } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at')
      .eq('email', email)
      .limit(1)

    if (fetchError) {
      console.error('📧 Error fetching user:', fetchError)
      // Por seguridad, no revelamos si el email existe o no
      return NextResponse.json({ 
        success: 'If the email exists and is not confirmed, a confirmation email has been sent.'
      })
    }

    if (!users || users.length === 0) {
      // Por seguridad, no revelamos si el email existe
      return NextResponse.json({ 
        success: 'If the email exists and is not confirmed, a confirmation email has been sent.'
      })
    }

    const user = users[0]
    
    if (user.email_confirmed_at) {
      return NextResponse.json({ 
        error: 'This email is already confirmed. You can log in directly.'
      }, { status: 400 })
    }

    // Generar un token de confirmación
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      password: 'dummy-password' // Requerido pero no se usa para confirmación
    })

    if (error || !data.properties?.action_link) {
      console.error('📧 Error generating confirmation link:', error)
      return NextResponse.json({ 
        error: 'Failed to send confirmation email. Please try again later.'
      }, { status: 500 })
    }

    // Extraer el token del enlace
    const actionLink = data.properties.action_link
    const url = new URL(actionLink)
    const token = url.searchParams.get('token')

    if (!token) {
      console.error('📧 No token found in action link')
      return NextResponse.json({ 
        error: 'Failed to generate confirmation token.'
      }, { status: 500 })
    }

    // Crear enlace personalizado
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buythetop.vip'
    const confirmationUrl = `${baseUrl}/auth/confirm?token=${token}&type=signup`

    // Enviar email de confirmación personalizado
    const displayName = email.split('@')[0]
    
    const result = await emailService.sendAccountConfirmation({
      to: email,
      name: displayName,
      confirmationUrl
    })

    if (!result.success) {
      console.error('📧 Error sending confirmation email:', result.error)
      return NextResponse.json({ 
        error: 'Failed to send confirmation email. Please try again later.'
      }, { status: 500 })
    }

    console.log('✅ Confirmation email sent successfully to:', email)

    return NextResponse.json({ 
      success: 'Confirmation email sent successfully. Please check your inbox.'
    })

  } catch (error) {
    console.error('📧 Send Confirmation: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred.' 
    }, { status: 500 })
  }
}
