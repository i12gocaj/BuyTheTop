export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { recalculateAllPositionsRobust } from '@/lib/position-utils'
import { deleteUserCompletely, getUserInfoForDeletion } from '@/lib/user-deletion'

export async function GET(_request: NextRequest) {
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

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Obtener todas las posiciones
    const { data: rankingsData, error: rankingsError } = await supabaseAdmin
      .from('rankings')
      .select('user_id, total_contribution, current_position, position_acquired_at')
      .gt('total_contribution', 0)
      .order('current_position', { ascending: true })

    if (rankingsError) {
      console.error('Error getting rankings:', rankingsError)
      return NextResponse.json({ error: 'Failed to get rankings data' }, { status: 500 })
    }

    if (!rankingsData || rankingsData.length === 0) {
      return NextResponse.json({
        positions: [],
        total: 0,
        timestamp: new Date().toISOString()
      })
    }

    // Obtener información de los perfiles de usuario
    const userIds = rankingsData.map(ranking => ranking.user_id)
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error getting user profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to get user profiles' }, { status: 500 })
    }

    // Combinar los datos
    const positions = rankingsData.map(ranking => {
      const userProfile = profilesData?.find(profile => profile.id === ranking.user_id)
      return {
        ...ranking,
        user_profiles: userProfile ? {
          display_name: userProfile.display_name,
          avatar_url: userProfile.avatar_url
        } : null
      }
    })

    return NextResponse.json({
      positions: positions || [],
      total: positions?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Positions management error:', error)
    return NextResponse.json({ 
      error: 'Failed to get positions', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log(`🗑️ Admin ${user.email} initiated complete user deletion for: ${userId}`)

    // Obtener información del usuario antes de eliminarlo (para logs)
    const userInfo = await getUserInfoForDeletion(userId, supabaseAdmin)
    console.log(`📋 Usuario a eliminar: ${userInfo.profile?.display_name || 'Sin nombre'} (${userInfo.authUser?.email || 'Sin email'})`)

    // Eliminar completamente al usuario y todos sus datos relacionados
    const deletionResult = await deleteUserCompletely(userId, supabaseAdmin)

    if (!deletionResult.success) {
      console.error('❌ Eliminación del usuario falló:', deletionResult.errors)
      return NextResponse.json({ 
        error: 'Failed to completely delete user',
        details: deletionResult.errors,
        partialDeletion: deletionResult.deletedData
      }, { status: 500 })
    }

    console.log('✅ Usuario eliminado completamente, iniciando recálculo de posiciones...')

    // Recalcular todas las posiciones automáticamente
    const recalcResult = await recalculateAllPositionsRobust()
    
    if (!recalcResult.success) {
      console.error('⚠️ Usuario eliminado pero falló el recálculo de posiciones:', recalcResult.error)
      return NextResponse.json({ 
        warning: 'User deleted successfully but failed to recalculate positions',
        userDeletion: deletionResult,
        recalculationError: recalcResult.error,
        message: 'User and all related data deleted successfully. Please manually recalculate positions from the admin panel.'
      }, { status: 200 })
    }

    console.log(`🎉 Proceso completo exitoso: Usuario eliminado y ${recalcResult.updatedCount} posiciones recalculadas`)

    return NextResponse.json({ 
      message: 'User and all related data deleted successfully',
      userId,
      userDeletion: {
        deletedData: deletionResult.deletedData,
        userId: deletionResult.userId
      },
      recalculation: {
        updatedPositions: recalcResult.updatedCount,
        totalPositions: recalcResult.totalPositions
      }
    })

  } catch (error) {
    console.error('❌ Error en eliminación completa del usuario:', error)
    return NextResponse.json({ 
      error: 'Failed to delete user', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    const { userId, action, data } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action required' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    let result = null

    switch (action) {
      case 'update_contribution':
        const { error: updateError } = await supabaseAdmin
          .from('rankings')
          .update({
            total_contribution: data.total_contribution,
          })
          .eq('user_id', userId)

        if (updateError) {
          console.error('Error updating contribution:', updateError)
          return NextResponse.json({ error: 'Failed to update contribution' }, { status: 500 })
        }
        result = { message: 'Contribution updated successfully' }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Update position error:', error)
    return NextResponse.json({ 
      error: 'Failed to update position', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
