// Utilidad para operaciones de autenticación en entorno Edge-compatible
import { emailService } from "@/lib/email/service"

interface SendConfirmationEmailOptions {
  email: string
  adminSupabaseUrl?: string
  adminSupabaseKey?: string
}

interface SendPasswordResetOptions {
  email: string
  adminSupabaseUrl?: string
  adminSupabaseKey?: string
}

export async function sendConfirmationEmailDirect(options: SendConfirmationEmailOptions) {
  const timestamp = new Date().toISOString()
  const logPrefix = `� [${timestamp}] sendConfirmationEmailDirect`
  
  try {
    console.log(`${logPrefix}: === INICIANDO PROCESO DIRECTO ===`)
    console.log(`${logPrefix}: Email objetivo: ${options.email}`)
    
    // Verificar configuración de Resend
    const hasResendKey = !!process.env.RESEND_API_KEY
    console.log(`${logPrefix}: RESEND_API_KEY disponible: ${hasResendKey}`)
    console.log(`${logPrefix}: RESEND_API_KEY preview: ${process.env.RESEND_API_KEY?.substring(0, 10)}...`)
    
    if (!hasResendKey) {
      console.error(`${logPrefix}: ❌ RESEND_API_KEY no configurada`)
      return { success: false, error: 'RESEND_API_KEY not configured' }
    }
    
    // Variables de entorno de email
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buythetop.vip'
    const fromEmail = process.env.FROM_EMAIL || 'BuyTheTop <noreply@buythetop.vip>'
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@buythetop.vip'
    
    console.log(`${logPrefix}: 🌐 Base URL: ${baseUrl}`)
    console.log(`${logPrefix}: 📬 From Email: ${fromEmail}`)
    console.log(`${logPrefix}: 🆘 Support Email: ${supportEmail}`)
    
    // Crear un token temporal simple
    const tokenTimestamp = Date.now()
    const token = Buffer.from(`${options.email}:${tokenTimestamp}`).toString('base64url')
    const confirmationUrl = `${baseUrl}/auth/confirm?token=${token}&type=signup&email=${encodeURIComponent(options.email)}`

    console.log(`${logPrefix}: 🎫 Token generado: ${token.substring(0, 20)}...`)
    console.log(`${logPrefix}: 🔗 Confirmation URL: ${confirmationUrl}`)

    // Preparar datos para el email
    const displayName = options.email.split('@')[0]
    const emailData = {
      to: options.email,
      name: displayName,
      confirmationUrl
    }
    
    console.log(`${logPrefix}: � Display name: ${displayName}`)
    console.log(`${logPrefix}: 📧 Email data preparado:`, emailData)
    console.log(`${logPrefix}: 🚀 Llamando emailService.sendAccountConfirmation...`)
    
    const result = await emailService.sendAccountConfirmation(emailData)
    
    console.log(`${logPrefix}: 📨 Resultado del emailService:`, result)
    console.log(`${logPrefix}: === PROCESO DIRECTO COMPLETADO ===`)
    
    return result
  } catch (error) {
    console.error(`${logPrefix}: ❌ EXCEPCIÓN en proceso directo:`, error)
    console.error(`${logPrefix}: Error stack:`, error instanceof Error ? error.stack : 'No stack available')
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function sendPasswordResetEmailDirect(options: SendPasswordResetOptions) {
  try {
    console.log('📧 Enviando email de reset directo para:', options.email)
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buythetop.vip'
    
    // Crear un token temporal simple
    const timestamp = Date.now()
    const token = Buffer.from(`${options.email}:${timestamp}:reset`).toString('base64url')
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(options.email)}`

    // Enviar email de reset personalizado
    const displayName = options.email.split('@')[0]
    
    const result = await emailService.sendPasswordReset({
      to: options.email,
      name: displayName,
      resetUrl
    })

    return result
  } catch (error) {
    console.error('❌ Error enviando email de reset directo:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
