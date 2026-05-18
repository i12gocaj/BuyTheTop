export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recalculateAllPositionsRobust } from '@/lib/position-utils'

export async function POST(_request: NextRequest) {
  try {
    // Verificar autenticación admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🔧 Manual position recalculation requested by admin:', user.email)

    // Recalcular todas las posiciones
    const result = await recalculateAllPositionsRobust()

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Failed to recalculate positions',
        details: result.error 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Position recalculation completed successfully',
      results: {
        totalPositions: result.totalPositions,
        updatedPositions: result.updatedCount,
        skippedPositions: result.totalPositions - result.updatedCount
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Manual position recalculation error:', error)
    return NextResponse.json({ 
      error: 'Failed to recalculate positions', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
