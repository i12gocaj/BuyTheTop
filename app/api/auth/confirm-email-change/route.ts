export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema
const ConfirmEmailChangeSchema = z.object({
  token: z.string().min(1),
  new_email: z.string().email('Invalid email format')
})

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Confirm Email Change: Starting confirmation process...')
    
    const body = await request.json()
    const validation = ConfirmEmailChangeSchema.safeParse(body)
    
    if (!validation.success) {
      const errorMessage = validation.error.errors.map(e => e.message).join(', ')
      console.error('📧 Validation failed:', errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { token, new_email } = validation.data
    
    // Create Supabase client
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ 
        error: "Service not available" 
      }, { status: 500 })
    }

    // Verify email change token
    console.log('📧 Verifying email change token...')
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email_change'
    })

    if (error) {
      console.error('📧 Token verification failed:', error)
      
      if (error.message.includes('expired')) {
        return NextResponse.json({ 
          error: 'The confirmation link has expired. Please request a new email change.' 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Invalid confirmation link.' 
      }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ 
        error: 'No user found for this token.' 
      }, { status: 400 })
    }

    // Verify that the email matches
    if (data.user.email !== new_email) {
      console.error('📧 Email mismatch:', { 
        tokenEmail: data.user.email, 
        requestedEmail: new_email 
      })
      return NextResponse.json({ 
        error: 'The email does not match the confirmation token.' 
      }, { status: 400 })
    }

    console.log('✅ Email change confirmed successfully for user:', data.user.id)
    console.log('✅ New email:', new_email)

    return NextResponse.json({ 
      success: 'Email updated successfully. Your new email is now active.',
      user: {
        id: data.user.id,
        email: data.user.email
      }
    })

  } catch (error) {
    console.error('📧 Confirm Email Change: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred.' 
    }, { status: 500 })
  }
}
