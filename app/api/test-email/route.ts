// Test endpoint for email service
export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/service'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Email Test: Starting test...')
    
    // Test environment variables
    const envCheck = {
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10),
      hasFromEmail: !!process.env.FROM_EMAIL,
      fromEmail: process.env.FROM_EMAIL,
      hasSupportEmail: !!process.env.SUPPORT_EMAIL,
      supportEmail: process.env.SUPPORT_EMAIL,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL
    }
    
    console.log('🧪 Environment check:', envCheck)
    
    return NextResponse.json({
      status: 'OK',
      environment: envCheck,
      message: 'Email service test endpoint'
    })
    
  } catch (error) {
    console.error('🧪 Email Test Error:', error)
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
