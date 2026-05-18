import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { emailService } from '@/lib/email/service'

export const runtime = 'edge'

// Schema de validación para el formulario de contacto
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email').max(255, 'Email is too long'),
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject is too long'),
  message: z.string().min(3, 'Message must be at least 3 characters').max(2000, 'Message is too long'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar los datos del formulario
    const validatedData = contactSchema.parse(body)
    
    // Log de la consulta
    console.log('📧 Nueva consulta de contacto:', {
      ...validatedData,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    })
    
    // Enviar email de notificación al equipo de soporte
    const notificationResult = await emailService.sendContactNotification(
      validatedData.name,
      validatedData.email,
      validatedData.subject,
      validatedData.message
    )

    // Enviar email de confirmación al usuario
    const confirmationResult = await emailService.sendContactConfirmation(
      validatedData.email,
      validatedData.name,
      validatedData.subject
    )

    // Log de resultados
    if (!notificationResult.success) {
      console.error('❌ Error enviando notificación:', notificationResult.error)
    }
    
    if (!confirmationResult.success) {
      console.error('❌ Error enviando confirmación:', confirmationResult.error)
    }

    // Determinar mensaje de respuesta
    let message = 'Your inquiry has been received successfully.'
    
    if (notificationResult.success && confirmationResult.success) {
      message += ' We have sent you a confirmation email and will respond to you soon.'
    } else if (notificationResult.success) {
      message += ' We will respond to your email soon.'
    } else if (confirmationResult.success) {
      message += ' We have sent you a confirmation email.'
    } else {
      message += ' Alternatively, you can write directly to support@buythetop.vip'
    }
    
    return NextResponse.json({
      success: true,
      message,
      emailsSent: {
        notification: notificationResult.success,
        confirmation: confirmationResult.success
      }
    })
    
  } catch (error) {
    console.error('❌ Error al procesar consulta de contacto:', error)
    
    if (error instanceof z.ZodError) {
      console.log('🔍 Zod validation errors:', error.errors)
      const response = NextResponse.json(
        { 
          success: false, 
          error: 'Invalid form data',
          details: error.errors.map(e => e.message)
        },
        { status: 400 }
      )
      console.log('🔍 Sending error response:', response)
      return response
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error. Please contact us directly via email.' 
      },
      { status: 500 }
    )
  }
}

// Endpoint GET para obtener información de contacto
export async function GET() {
  return NextResponse.json({
    supportEmail: 'support@buythetop.vip',
    responseTime: '24-48 hours',
    languages: ['English', 'Español'],
    supportHours: 'Monday to Friday, 9:00 - 18:00 CET',
  })
}
