export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Position History API - Starting request')
    
    // Create Supabase client
    const supabase = await createClient()
    
    if (!supabase) {
      console.error('🔄 Supabase client not available')
      return NextResponse.json({ 
        error: "Service not available. Please try again later."
      }, { status: 500 })
    }
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('🔄 Authentication failed:', userError)
      return NextResponse.json({ 
        error: "Not authenticated. Please log in and try again."
      }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'history' or 'overtakes'
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log('🔄 Fetching position data for user:', user.id.substring(0, 8) + '...', 'type:', type)

    if (type === 'overtakes') {
      // Get users who recently overtook this user (without JOIN to avoid FK issues)
      let overtakesData: any[] = []
      
      try {
        const { data, error: overtakesError } = await supabase
          .from("position_history")
          .select("*")
          .eq("overtaken_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(limit)
        
        if (overtakesError) {
          console.error('🔄 Position overtakes fetch error:', overtakesError)
          
          // Handle specific error cases
          if (overtakesError.code === 'PGRST116' || 
              overtakesError.message.includes('does not exist') ||
              overtakesError.message.includes('relation') && overtakesError.message.includes('does not exist')) {
            console.warn('🔄 position_history table does not exist')
            return NextResponse.json({ data: [] })
          }
          
          if (overtakesError.code === '42703' || overtakesError.message.includes('column') && overtakesError.message.includes('does not exist')) {
            console.warn('🔄 overtaken_user_id column does not exist')
            return NextResponse.json({ data: [] })
          }
          
          if (overtakesError.code === '42501' || overtakesError.message.includes('permission denied')) {
            console.warn('🔄 No permission to access position_history')
            return NextResponse.json({ data: [] })
          }
          
          throw overtakesError
        }
        
        overtakesData = data || []
      } catch (error) {
        console.warn('🔄 Could not fetch overtakes, returning empty array:', error)
        return NextResponse.json({ data: [] })
      }

      // If we have overtakes data, get the display names separately
      let enrichedOvertakes = overtakesData
      if (overtakesData && overtakesData.length > 0) {
        try {
          const userIds = [...new Set(overtakesData.map((o: any) => o.user_id).filter(Boolean))]
          
          if (userIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
              .from("user_profiles")
              .select("id, display_name")
              .in("id", userIds)
            
            if (!profilesError && profilesData) {
              // Enrich overtakes with display names
              enrichedOvertakes = overtakesData.map((overtake: any) => {
                const profile = profilesData.find((p: any) => p.id === overtake.user_id)
                return {
                  ...overtake,
                  user_profiles: profile ? { display_name: profile.display_name } : null
                }
              })
            }
          }
        } catch (profileError) {
          console.warn('🔄 Could not fetch user profiles for overtakes:', profileError)
          // Continue with original data without display names
        }
      }

      console.log('🔄 Position overtakes fetched successfully, count:', enrichedOvertakes?.length || 0)
      return NextResponse.json({ data: enrichedOvertakes })
    } else {
      // Default: Get position history
      const { data: positionData, error: positionError } = await supabase
        .from("position_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit)
      
      if (positionError) {
        console.error('🔄 Position history fetch error:', positionError)
        
        // Handle specific error cases
        if (positionError.code === 'PGRST116' || 
            positionError.message.includes('does not exist') ||
            positionError.message.includes('relation') && positionError.message.includes('does not exist')) {
          console.warn('🔄 position_history table does not exist')
          return NextResponse.json({ data: [] })
        }
        
        if (positionError.code === '42501' || positionError.message.includes('permission denied')) {
          console.warn('🔄 No permission to access position_history')
          return NextResponse.json({ data: [] })
        }
        
        return NextResponse.json({ 
          error: 'Failed to fetch position history',
          details: positionError.message 
        }, { status: 500 })
      }

      console.log('🔄 Position history fetched successfully, count:', positionData?.length || 0)
      return NextResponse.json({ data: positionData || [] })
    }

  } catch (error) {
    console.error('🔄 Position History API - Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
