export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { emailService } from '@/lib/email/service'
import { addLog } from '@/lib/logger'
import { z } from 'zod'

// Schema de validación
const SendPasswordResetSchema = z.object({
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
    addLog('🚀🚀🚀 ENDPOINT REACHED: Send Password Reset API starting!')
    addLog('📧 Send Password Reset: Starting request...')
    addLog(`📧 Environment check: ${JSON.stringify({
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasResendKey: !!process.env.RESEND_API_KEY,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL
    })}`)
    
    const body = await request.json()
    const validation = SendPasswordResetSchema.safeParse(body)
    
    if (!validation.success) {
      const errorMessage = validation.error.errors.map((e: any) => e.message).join(', ')
      addLog(`📧 Validation failed: ${errorMessage}`)
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { email } = validation.data
    
    // Crear cliente admin de Supabase
    const supabase = createAdminClient()

    // Por seguridad, no revelamos información sobre si el email existe
    addLog(`📧 Processing password reset for: ${email}`)

    // Generar enlace de recuperación usando Supabase Admin API
    addLog('📧 Calling supabase.auth.admin.generateLink...')
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email
    })

    addLog(`📧 generateLink response: ${JSON.stringify({ 
      hasData: !!data, 
      hasError: !!error, 
      errorMessage: error?.message,
      hasActionLink: !!data?.properties?.action_link 
    })}`)

    if (error) {
      addLog(`📧 Error generating recovery link: ${error.message}`)
      // Por seguridad, siempre devolvemos éxito
      return NextResponse.json({ 
        success: 'If the email exists, a password reset link has been sent.'
      })
    }

    if (!data.properties?.action_link) {
      addLog('📧 No action link generated')
      return NextResponse.json({ 
        success: 'If the email exists, a password reset link has been sent.'
      })
    }

    // Extraer el token del enlace
    const actionLink = data.properties.action_link
    const url = new URL(actionLink)
    const token = url.searchParams.get('token')

    if (!token) {
      addLog('📧 No token found in action link')
      return NextResponse.json({ 
        success: 'If the email exists, a password reset link has been sent.'
      })
    }

    // Crear enlace personalizado que vaya a través del callback
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buythetop.vip'
    const resetUrl = `${baseUrl}/auth/callback?code=${token}&type=recovery`

    // Enviar email de recuperación personalizado
    const displayName = email.split('@')[0]
    
    addLog(`📧 Calling emailService.sendPasswordReset with: ${JSON.stringify({
      to: email,
      name: displayName,
      resetUrl: resetUrl.substring(0, 50) + '...'
    })}`)
    
    const result = await emailService.sendPasswordReset({
      to: email,
      name: displayName,
      resetUrl
    })

    addLog(`📧 Email service result: ${JSON.stringify(result)}`)

    if (!result.success) {
      addLog(`📧 Error sending password reset email: ${result.error}`)
      // Por seguridad, no revelamos el error específico
      return NextResponse.json({ 
        success: 'If the email exists, a password reset link has been sent.'
      })
    }

    addLog(`✅ Password reset email sent successfully to: ${email}`)

    return NextResponse.json({ 
      success: 'If the email exists, a password reset link has been sent. Please check your inbox.'
    })

  } catch (error) {
    addLog(`📧 Send Password Reset: Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return NextResponse.json({ 
      success: 'If the email exists, a password reset link has been sent.'
    })
  }
}
