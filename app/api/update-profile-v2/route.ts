export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ProfileUpdateSchema } from '@/lib/validation'
import { validateContentMiddleware } from '@/lib/content-filter-middleware'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Profile Update API v2 - Starting request')
    
    // Get cookies from request
    const cookieHeader = request.headers.get('cookie')
    console.log('🔄 Cookie header present:', !!cookieHeader)
    console.log('🔄 Cookie header length:', cookieHeader?.length || 0)
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Get user with detailed logging
    console.log('🔄 Attempting to get user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('🔄 User authentication result:', {
      hasUser: !!user,
      userId: user?.id?.substring(0, 8) + '...',
      email: user?.email,
      errorMessage: userError?.message
    })

    if (userError || !user) {
      console.error('🔄 Authentication failed:', userError)
      return NextResponse.json({ 
        error: "Not authenticated. Please log in and try again.",
        details: userError?.message
      }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('🔄 Request body keys:', Object.keys(body))
    
    const validation = ProfileUpdateSchema.safeParse(body)
    if (!validation.success) {
      const errorMessage = validation.error.errors.map((e: any) => e.message).join(', ')
      console.error('🔄 Validation failed:', errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { display_name, bio, position_notifications_enabled } = validation.data

    // Validate content using the content filter middleware
    const contentValidationError = await validateContentMiddleware(
      request,
      {
        display_name: display_name || undefined,
        bio: bio || undefined
      },
      user.id
    )

    if (contentValidationError) {
      console.error('🔄 Content validation failed')
      return contentValidationError
    }

        // Update user profile in database
    console.log('🔄 Updating profile in database...')
    const { error: updateError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id, // Usar 'id' en lugar de 'user_id'
        display_name: display_name,
        description: bio || null,
        position_notifications_enabled: position_notifications_enabled ?? true,
        updated_at: new Date().toISOString(),
      })

    if (updateError) {
      console.error('🔄 Database update failed:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update profile in database',
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('🔄 Profile updated successfully')
    return NextResponse.json({ 
      success: 'Profile updated successfully!',
      user: {
        id: user.id,
        email: user.email,
        displayName: display_name
      }
    })

  } catch (error) {
    console.error('🔄 Profile Update API v2 - Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
