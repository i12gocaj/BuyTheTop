// Base template para todos los emails
const getBaseEmailTemplate = (content: string, brandName: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brandName}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #0a0a0a;
            color: #e5e5e5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0a0a0a;
        }
        .header {
            text-align: center;
            padding: 40px 20px 20px;
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #c9a96e;
            margin-bottom: 10px;
        }
        .content {
            padding: 40px 20px;
            background-color: #1a1a1a;
            margin: 0 20px;
            border-radius: 8px;
            border: 1px solid #333;
        }
        .button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #c9a96e 0%, #d4b577 100%);
            color: #000;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            transition: all 0.2s ease;
        }
        .button:hover {
            background: linear-gradient(135deg, #d4b577 0%, #c9a96e 100%);
            transform: translateY(-1px);
        }
        .footer {
            text-align: center;
            padding: 40px 20px;
            color: #8a8a8a;
            font-size: 14px;
        }
        .footer a {
            color: #c9a96e;
            text-decoration: none;
        }
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #333 50%, transparent 100%);
            margin: 30px 0;
        }
        .warning {
            background-color: #2a1f1f;
            border: 1px solid #4a2f2f;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
            color: #ffa500;
        }
        .info {
            background-color: #1f2a2a;
            border: 1px solid #2f4a4a;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
            color: #87ceeb;
        }
        h1 {
            color: #c9a96e;
            font-size: 28px;
            margin-bottom: 20px;
            text-align: center;
        }
        h2 {
            color: #c9a96e;
            font-size: 22px;
            margin-bottom: 16px;
        }
        p {
            line-height: 1.6;
            margin-bottom: 16px;
            color: #e5e5e5;
        }
        .highlight {
            color: #c9a96e;
            font-weight: 600;
        }
        .center {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${brandName}</div>
            <p style="margin: 0; color: #8a8a8a;">👑 Join the elite • Climb the rankings • Claim your throne 👑</p>
        </div>
        
        <div class="content">
            ${content}
        </div>
        
        <div class="footer">
            <p>Need help? <a href="mailto:{{supportEmail}}">Contact us</a></p>
            <div class="divider"></div>
            <p>This email was sent by ${brandName}<br>
            If you didn't request this action, you can safely ignore this message.</p>
        </div>
    </div>
</body>
</html>
`

// Template para confirmación de cuenta
export const getConfirmationEmailTemplate = ({
  name,
  confirmationUrl,
  brandName,
  supportEmail
}: {
  name: string
  confirmationUrl: string
  brandName: string
  supportEmail: string
}) => {
  const content = `
    <h1>Welcome to ${brandName}!</h1>
    
    <p>Hello <span class="highlight">${name}</span>,</p>
    
    <p>Thank you for signing up for ${brandName}. To complete your registration and start using your account, please confirm your email address.</p>
    
    <div class="center">
        <a href="${confirmationUrl}" class="button">Confirm my account</a>
    </div>
    
    <div class="info">
        <strong>What can you do once your account is confirmed?</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Access your personalized profile</li>
            <li>View detailed statistics</li>
            <li>Participate in rankings</li>
            <li>Receive important notifications</li>
        </ul>
    </div>
    
    <div class="warning">
        <strong>⚠️ Important:</strong> This confirmation link expires in 24 hours for security. If you don't confirm your account within this time, you'll need to sign up again.
    </div>
    
    <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #c9a96e; font-family: monospace; background-color: #0a0a0a; padding: 8px; border-radius: 4px;">${confirmationUrl}</p>
  `
  
  return getBaseEmailTemplate(content, brandName).replace('{{supportEmail}}', supportEmail)
}

// Template para recuperación de contraseña
export const getPasswordResetEmailTemplate = ({
  name,
  resetUrl,
  brandName,
  supportEmail
}: {
  name: string
  resetUrl: string
  brandName: string
  supportEmail: string
}) => {
  const content = `
    <h1>Reset your password</h1>
    
    <p>Hello <span class="highlight">${name}</span>,</p>
    
    <p>We received a request to reset the password for your ${brandName} account.</p>
    
    <div class="center">
        <a href="${resetUrl}" class="button">Reset password</a>
    </div>
    
    <div class="warning">
        <strong>⚠️ Important security information:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>This link expires in 1 hour</li>
            <li>Can only be used once</li>
            <li>If you didn't request this change, ignore this email</li>
        </ul>
    </div>
    
    <div class="info">
        <strong>💡 Tips for a secure password:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Use at least 8 characters</li>
            <li>Combine uppercase and lowercase letters</li>
            <li>Include numbers and symbols</li>
            <li>Don't use personal information</li>
        </ul>
    </div>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #c9a96e; font-family: monospace; background-color: #0a0a0a; padding: 8px; border-radius: 4px;">${resetUrl}</p>
    
    <p>If you didn't request a password reset, your account is still secure and you can ignore this message.</p>
  `
  
  return getBaseEmailTemplate(content, brandName).replace('{{supportEmail}}', supportEmail)
}

// Template para cambio de email
export const getEmailChangeEmailTemplate = ({
  name,
  confirmationUrl,
  newEmail,
  brandName,
  supportEmail
}: {
  name: string
  confirmationUrl: string
  newEmail: string
  brandName: string
  supportEmail: string
}) => {
  const content = `
    <h1>Confirm your new email</h1>
    
    <p>Hello <span class="highlight">${name}</span>,</p>
    
    <p>We received a request to change your ${brandName} account email to:</p>
    
    <p class="center" style="font-size: 18px; font-weight: 600; color: #c9a96e; background-color: #0a0a0a; padding: 12px; border-radius: 6px; border: 1px solid #333;">${newEmail}</p>
    
    <p>To confirm this change, click the button below:</p>
    
    <div class="center">
        <a href="${confirmationUrl}" class="button">Confirm new email</a>
    </div>
    
    <div class="warning">
        <strong>⚠️ Important:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>This link expires in 24 hours</li>
            <li>Once confirmed, your previous email will no longer be valid</li>
            <li>You'll receive notifications on both emails</li>
        </ul>
    </div>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #c9a96e; font-family: monospace; background-color: #0a0a0a; padding: 8px; border-radius: 4px;">${confirmationUrl}</p>
    
    <p>If you didn't request this email change, <a href="mailto:${supportEmail}" style="color: #c9a96e;">contact us immediately</a> to protect your account.</p>
  `
  
  return getBaseEmailTemplate(content, brandName).replace('{{supportEmail}}', supportEmail)
}

// Template de bienvenida (después de confirmar cuenta)
export const getWelcomeEmailTemplate = ({
  name,
  brandName,
  dashboardUrl,
  supportEmail
}: {
  name: string
  brandName: string
  dashboardUrl: string
  supportEmail: string
}) => {
  const content = `
    <h1>Your account is ready! 🎉</h1>
    
    <p>Congratulations <span class="highlight">${name}</span>!</p>
    
    <p>Your ${brandName} account has been successfully confirmed. You now have access to all platform features.</p>
    
    <div class="center">
        <a href="${dashboardUrl}" class="button">Go to my profile</a>
    </div>
    
    <h2>What can you do now?</h2>
    
    <div style="display: grid; gap: 20px; margin: 30px 0;">
        <div style="background-color: #0a0a0a; padding: 20px; border-radius: 8px; border: 1px solid #333;">
            <h3 style="color: #c9a96e; margin: 0 0 10px 0;">📊 View your profile</h3>
            <p style="margin: 0; color: #e5e5e5;">Access your personalized statistics and trading metrics.</p>
        </div>
        
        <div style="background-color: #0a0a0a; padding: 20px; border-radius: 8px; border: 1px solid #333;">
            <h3 style="color: #c9a96e; margin: 0 0 10px 0;">🏆 Participate in rankings</h3>
            <p style="margin: 0; color: #e5e5e5;">Compete with other traders and climb the global leaderboard.</p>
        </div>
        
        <div style="background-color: #0a0a0a; padding: 20px; border-radius: 8px; border: 1px solid #333;">
            <h3 style="color: #c9a96e; margin: 0 0 10px 0;">⚙️ Customize settings</h3>
            <p style="margin: 0; color: #e5e5e5;">Adjust your profile and notification preferences.</p>
        </div>
    </div>
    
    <div class="info">
        <strong>💡 Tip:</strong> Complete your profile with a photo and additional information to stand out in the community.
    </div>
    
    <p>If you have any questions or need help getting started, don't hesitate to contact us. We're here to help!</p>
    
    <p>Welcome to the ${brandName} community! 🚀</p>
  `
  
  return getBaseEmailTemplate(content, brandName).replace('{{supportEmail}}', supportEmail)
}

// Template genérico para notificaciones
export const getNotificationEmailTemplate = ({
  name,
  title,
  message,
  actionUrl,
  actionText,
  brandName,
  supportEmail
}: {
  name: string
  title: string
  message: string
  actionUrl?: string
  actionText?: string
  brandName: string
  supportEmail: string
}) => {
  const content = `
    <h1>${title}</h1>
    
    <p>Hola <span class="highlight">${name}</span>,</p>
    
    <p>${message}</p>
    
    ${actionUrl && actionText ? `
    <div class="center">
        <a href="${actionUrl}" class="button">${actionText}</a>
    </div>
    ` : ''}
    
    <p>Este es un mensaje automático del sistema ${brandName}.</p>
  `
  
  return getBaseEmailTemplate(content, brandName).replace('{{supportEmail}}', supportEmail)
}

// Template para notificación de contacto (al equipo de soporte)
export function getContactNotificationTemplate(
  senderName: string,
  senderEmail: string, 
  subject: string,
  message: string,
  brandName: string = 'BuyTheTop'
): string {
  const content = `
    <h2>New Contact Inquiry</h2>
    
    <div style="background-color: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>From:</strong> ${senderName} (${senderEmail})</p>
        <p><strong>Subject:</strong> ${subject}</p>
    </div>
    
    <h3>Message:</h3>
    <div style="background-color: #2a2a2a; padding: 20px; border-radius: 8px; border-left: 4px solid #c9a96e;">
        ${message.replace(/\n/g, '<br>')}
    </div>
    
    <p>Reply directly to this email to contact the user.</p>
  `
  
  return getBaseEmailTemplate(content, brandName)
}

// Template para confirmación automática al usuario
export function getContactConfirmationTemplate(
  name: string,
  subject: string,
  brandName: string = 'BuyTheTop'
): string {
  const content = `
    <h2>We've received your inquiry</h2>
    
    <p>Hello <span class="highlight">${name}</span>,</p>
    
    <p>Thank you for contacting us. We've received your inquiry about: <strong>${subject}</strong></p>
    
    <p>We will respond within 24-48 hours. If you need immediate assistance, you can write directly to support@buythetop.vip</p>
    
    <div style="background-color: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>💡 Tip:</strong> For a faster response, make sure to include all relevant details in your inquiry.</p>
    </div>
    
    <p>Best regards,<br>The ${brandName} team</p>
  `
  
  return getBaseEmailTemplate(content, brandName)
}

// Template para notificaciones de cambio de posición
export function getPositionChangeNotificationTemplate(
  userName: string,
  oldPosition: number,
  newPosition: number,
  overtakenBy: string,
  brandName: string = 'BuyTheTop'
): string {
  const content = `
    <h1>Your ranking position has changed!</h1>
    
    <p>Hello <span class="highlight">${userName}</span>,</p>
    
    <p>We're writing to inform you that your position in the <strong>${brandName}</strong> ranking has been updated:</p>
    
    <div style="background-color: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c9a96e;">
        <p><strong>Previous position:</strong> #${oldPosition}</p>
        <p><strong>New position:</strong> #${newPosition}</p>
        <p><strong>Overtaken by:</strong> ${overtakenBy}</p>
    </div>
    
    <p>Don't give up! You can recover your position by making new contributions.</p>
    
    <div class="center">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://buythetop.xyz'}" class="button">View Current Ranking</a>
    </div>
    
    <p style="font-size: 12px; color: #666; margin-top: 30px;">
      If you don't want to receive these notifications, you can disable them in your profile.
    </p>
  `
  
  return getBaseEmailTemplate(content, brandName)
}
