import { Resend } from 'resend'
import { 
  getConfirmationEmailTemplate,
  getPasswordResetEmailTemplate,
  getEmailChangeEmailTemplate,
  getWelcomeEmailTemplate,
  getContactNotificationTemplate,
  getPositionChangeNotificationTemplate,
  getContactConfirmationTemplate
} from './templates'

// Configuración del servicio de email
const resend = new Resend(process.env.RESEND_API_KEY)

// Tipos para los emails
export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export interface ConfirmationEmailData {
  to: string
  name: string
  confirmationUrl: string
}

export interface PasswordResetEmailData {
  to: string
  name: string
  resetUrl: string
}

export interface EmailChangeEmailData {
  to: string
  name: string
  confirmationUrl: string
  newEmail: string
}

export interface WelcomeEmailData {
  to: string
  name: string
}

// Configuración de la marca
const BRAND_CONFIG = {
  name: 'BuyTheTop',
  domain: process.env.NEXT_PUBLIC_SITE_URL || 'https://buythetop.vip',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@buythetop.vip',
  from: process.env.FROM_EMAIL || 'BuyTheTop <noreply@buythetop.vip>'
}

// Configuración anti-spam
const EMAIL_CONFIG = {
  // Agregar headers para evitar spam
  headers: {
    'List-Unsubscribe': '<mailto:unsubscribe@buythetop.vip>',
    'X-Entity-Ref-ID': 'buythetop-system',
    'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN',
  },
  // Texto alternativo para clientes que no soportan HTML
  generateTextVersion: (subject: string, actionUrl?: string) => {
    return `
BuyTheTop - ${subject}

This is an automated message from BuyTheTop.

${actionUrl ? `Please visit: ${actionUrl}` : ''}

If you did not request this action, please ignore this email.

---
BuyTheTop Team
https://buythetop.vip
support@buythetop.vip

To unsubscribe, reply with "UNSUBSCRIBE" in the subject line.
    `.trim()
  }
}

class EmailService {
  
  /**
   * Función base para enviar emails
   */
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar API Key
      if (!process.env.RESEND_API_KEY) {
        return { success: false, error: 'Email service not configured' }
      }

      // Preparar datos para Resend con mejoras anti-spam
      const emailPayload: any = {
        from: emailData.from || BRAND_CONFIG.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: EMAIL_CONFIG.generateTextVersion(emailData.subject),
        headers: EMAIL_CONFIG.headers,
        tags: [
          { name: 'category', value: 'transactional' },
          { name: 'environment', value: process.env.NODE_ENV || 'production' }
        ]
      }

      // Agregar Reply-To si está especificado
      if (emailData.replyTo) {
        emailPayload.replyTo = emailData.replyTo
      }
      
      const result = await resend.emails.send(emailPayload)

      if (result.error) {
        return { 
          success: false, 
          error: `Resend error: ${JSON.stringify(result.error)}` 
        }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Email de confirmación de cuenta
   */
  async sendAccountConfirmation(data: ConfirmationEmailData) {
    const html = getConfirmationEmailTemplate({
      name: data.name,
      confirmationUrl: data.confirmationUrl,
      brandName: BRAND_CONFIG.name,
      supportEmail: BRAND_CONFIG.supportEmail
    })

    return this.sendEmail({
      to: data.to,
      subject: `Confirm your account - ${BRAND_CONFIG.name}`,
      html
    })
  }

  /**
   * Email de recuperación de contraseña
   */
  async sendPasswordReset(data: PasswordResetEmailData) {
    const html = getPasswordResetEmailTemplate({
      name: data.name,
      resetUrl: data.resetUrl,
      brandName: BRAND_CONFIG.name,
      supportEmail: BRAND_CONFIG.supportEmail
    })

    return this.sendEmail({
      to: data.to,
      subject: `Reset your password - ${BRAND_CONFIG.name}`,
      html
    })
  }

  /**
   * Email de confirmación de cambio de email
   */
  async sendEmailChange(data: EmailChangeEmailData) {
    const html = getEmailChangeEmailTemplate({
      name: data.name,
      confirmationUrl: data.confirmationUrl,
      newEmail: data.newEmail,
      brandName: BRAND_CONFIG.name,
      supportEmail: BRAND_CONFIG.supportEmail
    })

    return this.sendEmail({
      to: data.to,
      subject: `Confirm your new email - ${BRAND_CONFIG.name}`,
      html
    })
  }

  /**
   * Email de bienvenida
   */
  async sendWelcomeEmail(data: WelcomeEmailData) {
    const html = getWelcomeEmailTemplate({
      name: data.name,
      brandName: BRAND_CONFIG.name,
      dashboardUrl: `${BRAND_CONFIG.domain}/profile`,
      supportEmail: BRAND_CONFIG.supportEmail
    })

    return this.sendEmail({
      to: data.to,
      subject: `Welcome to ${BRAND_CONFIG.name}! 🎉`,
      html
    })
  }

  /**
   * Envía notificación de contacto al equipo de soporte
   */
  async sendContactNotification(
    senderName: string,
    senderEmail: string,
    subject: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    const { getContactNotificationTemplate } = await import('./templates')
    
    const html = getContactNotificationTemplate(
      senderName,
      senderEmail,
      subject,
      message,
      BRAND_CONFIG.name
    )

    return this.sendEmail({
      to: BRAND_CONFIG.supportEmail,
      subject: `[Contact] ${subject}`,
      html,
      from: `${BRAND_CONFIG.name} <noreply@buythetop.vip>`,
      replyTo: senderEmail, // Cuando respondes, va directo al usuario
    })
  }

  /**
   * Envía confirmación automática al usuario que envió el contacto
   */
  async sendContactConfirmation(
    userEmail: string,
    userName: string,
    subject: string
  ): Promise<{ success: boolean; error?: string }> {
    const { getContactConfirmationTemplate } = await import('./templates')
    
    const html = getContactConfirmationTemplate(
      userName,
      subject,
      BRAND_CONFIG.name
    )

    return this.sendEmail({
      to: userEmail,
      subject: `Confirmation: We've received your inquiry - ${BRAND_CONFIG.name}`,
      html,
      from: `${BRAND_CONFIG.name} Support <support@buythetop.vip>`,
    })
  }

  /**
   * Envía notificación de cambio de posición
   */
  async sendPositionChangeNotification(
    userEmail: string,
    userName: string,
    oldPosition: number,
    newPosition: number,
    overtakenBy: string
  ): Promise<{ success: boolean; error?: string }> {
    const { getPositionChangeNotificationTemplate } = await import('./templates')
    
    const html = getPositionChangeNotificationTemplate(
      userName,
      oldPosition,
      newPosition,
      overtakenBy,
      BRAND_CONFIG.name
    )

    return this.sendEmail({
      to: userEmail,
      subject: `Your ranking position has changed - ${BRAND_CONFIG.name}`,
      html,
      from: `${BRAND_CONFIG.name} <noreply@buythetop.vip>`,
    })
  }
}

// Instancia singleton del servicio
export const emailService = new EmailService()
export default emailService
