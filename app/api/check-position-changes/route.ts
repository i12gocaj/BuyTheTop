export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkPositionChangesAndNotify } from '@/lib/position-notifications'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Position Notifications Check API - Starting request')
    
    // Create Supabase client and verify admin access
    const supabase = await createClient()
    
    // Get user with detailed logging
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('🔄 Authentication failed:', userError)
      return NextResponse.json({ 
        error: "Not authenticated. Please log in and try again.",
        details: userError?.message
      }, { status: 401 })
    }

    // Check if user is admin (optional - you might want to restrict this)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // For now, allow any authenticated user to trigger this (you can change this)
    // if (userProfile?.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    // }

    console.log('🔄 Running position change detection...')
    
    // Run the position change detection and notification system
    const result = await checkPositionChangesAndNotify()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Position check completed successfully. ${result.notificationsSent} notifications sent.`,
        notificationsSent: result.notificationsSent,
        errors: result.errors.length > 0 ? result.errors : undefined
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Position check completed with errors',
        notificationsSent: result.notificationsSent,
        errors: result.errors
      }, { status: 500 })
    }

  } catch (error) {
    console.error('🔄 Position Notifications Check API - Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Also allow GET for easier testing
export async function GET(request: NextRequest) {
  return POST(request)
}
