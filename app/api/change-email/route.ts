export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { EmailChangeSchema } from '@/lib/validation'
import { addLog } from '@/lib/logger'

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
    addLog('🔄 Change Email API - Starting request')
    addLog(`🔄 Environment check: ${JSON.stringify({
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasResendKey: !!process.env.RESEND_API_KEY
    })}`)
    
    // Create Supabase clients
    const supabase = await createServerClient() // Para auth del usuario con cookies
    const adminSupabase = createAdminClient() // Para generar enlaces
    
    // Get user
    addLog('🔄 Getting authenticated user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    addLog(`🔄 Auth result: ${JSON.stringify({
      hasUser: !!user,
      userId: user?.id?.substring(0, 8) + '...',
      email: user?.email,
      errorMessage: userError?.message
    })}`)
    
    if (userError || !user) {
      addLog(`🔄 Authentication failed: ${userError?.message}`)
      return NextResponse.json({ 
        error: "Not authenticated. Please log in and try again."
      }, { status: 401 })
    }

    // Parse and validate request body
    addLog('🔄 Parsing request body...')
    const body = await request.json()
    addLog(`🔄 Request body: ${JSON.stringify(body)}`)
    
    const validation = EmailChangeSchema.safeParse(body)
    
    if (!validation.success) {
      const errorMessage = validation.error.errors.map((e: any) => e.message).join(', ')
      addLog(`🔄 Validation failed: ${errorMessage}`)
      addLog(`🔄 Validation errors: ${JSON.stringify(validation.error.errors)}`)
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { new_email } = validation.data
    addLog(`🔄 Validated new_email: ${new_email}`)

    // Check if new email is the same as current email
    if (new_email === user.email) {
      return NextResponse.json({ 
        error: 'The new email address is the same as your current email address.'
      }, { status: 400 })
    }

    // Special handling for users with invalid current emails
    const hasInvalidCurrentEmail = user.email && (
      user.email.includes('.demo') || 
      user.email.includes('.test') || 
      user.email.includes('.local')
    )

    if (hasInvalidCurrentEmail) {
      addLog(`🔄 User has invalid current email: ${user.email}`)
      return NextResponse.json({ 
        error: `Your current email address (${user.email}) is from a test domain. Email changes are not available for test accounts. Please contact support if you need to update your email.`
      }, { status: 400 })
    }

    // Create redirect URL for email confirmation
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://buythetop.vip')
    const redirectUrl = `${baseUrl}/auth/callback?type=email_change`
    
    addLog(`🔄 Using redirect URL: ${redirectUrl}`)
    addLog('🔄 Attempting to update user email...')
    addLog(`🔄 Current email: ${user.email}`)
    addLog(`🔄 New email to set: ${new_email}`)
    
    // Generar enlace de confirmación usando Supabase Admin API
    addLog('🔄 Calling adminSupabase.auth.admin.generateLink...')
    addLog(`🔄 generateLink params: ${JSON.stringify({
      type: 'email_change_new',
      email: user.email,
      newEmail: new_email
    })}`)
    
    // Usar email_change_new en lugar de email_change_current para evitar el error de secure email change
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'email_change_new',
      email: user.email!,
      newEmail: new_email
    })

    addLog(`🔄 generateLink response: ${JSON.stringify({ 
      hasData: !!linkData, 
      hasError: !!linkError, 
      errorMessage: linkError?.message,
      errorCode: linkError?.code,
      hasActionLink: !!linkData?.properties?.action_link,
      actionLinkPreview: linkData?.properties?.action_link?.substring(0, 100)
    })}`)

    if (linkError || !linkData.properties?.action_link) {
      addLog(`🔄 Error generating email change link: ${linkError?.message}`)
      return NextResponse.json({ 
        error: 'Failed to initiate email change. Please try again later.'
      }, { status: 500 })
    }

    // Extraer el token del enlace
    const actionLink = linkData.properties.action_link
    const url = new URL(actionLink)
    const token = url.searchParams.get('token')

    if (!token) {
      addLog('🔄 No token found in action link')
      return NextResponse.json({ 
        error: 'Failed to generate confirmation token.'
      }, { status: 500 })
    }

    // Create custom link that goes through callback
    const confirmationUrl = `${baseUrl}/auth/callback?code=${token}&type=email_change&new_email=${encodeURIComponent(new_email)}`

    // Send custom email confirmation
    const { emailService } = await import('@/lib/email/service')
    const displayName = user.email?.split('@')[0] || 'User'
    
    const result = await emailService.sendEmailChange({
      to: new_email,
      name: displayName,
      confirmationUrl,
      newEmail: new_email
    })

    if (!result.success) {
      addLog(`🔄 Error sending email change confirmation: ${result.error}`)
      return NextResponse.json({ 
        error: 'Failed to send confirmation email. Please try again later.'
      }, { status: 500 })
    }

    addLog('🔄 Email change confirmation sent successfully')
    return NextResponse.json({ 
      success: `An email confirmation has been sent to ${new_email}. Check your inbox and click the link to complete the email change.`,
      newEmail: new_email
    })

  } catch (error) {
    addLog(`🔄 Change Email API - Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
