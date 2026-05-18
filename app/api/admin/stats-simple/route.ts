export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Admin stats endpoint called')
    
    // Usar el cliente de Supabase que maneja las cookies automáticamente
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ No authenticated user found')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.email)

    // Verificar si es admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      console.log('❌ User is not admin:', profile?.role)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('✅ Admin access confirmed')

    // Crear cliente admin para obtener todos los datos
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

    // Obtener estadísticas de usuarios
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error getting users:', usersError)
      return NextResponse.json({ error: 'Failed to get users', details: usersError.message }, { status: 500 })
    }

    console.log('✅ Users data retrieved:', users.users.length)

    // Obtener perfiles de usuario
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('role, created_at')

    if (profilesError) {
      console.error('Error getting profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to get profiles', details: profilesError.message }, { status: 500 })
    }

    console.log('✅ Profiles data retrieved:', profiles?.length || 0)

    // Obtener posiciones de rankings
    const { data: rankings, error: rankingsError } = await supabaseAdmin
      .from('rankings')
      .select('user_id, total_contribution')
      .gt('total_contribution', 0)

    if (rankingsError) {
      console.error('Error getting rankings:', rankingsError)
    }

    console.log('✅ Rankings data retrieved:', rankings?.length || 0)

    // Calcular estadísticas
    const totalAuthUsers = users.users.length
    const confirmedUsers = users.users.filter(u => u.email_confirmed_at).length
    const totalProfiles = profiles?.length || 0
    const totalPositions = rankings?.length || 0
    const adminUsers = profiles?.filter(p => p.role === 'admin').length || 0
    
    // Última actividad (usuario más reciente)
    const latestUser = users.users
      .filter(u => u.last_sign_in_at) // Solo usuarios que han iniciado sesión
      .sort((a, b) => new Date(b.last_sign_in_at!).getTime() - 
                      new Date(a.last_sign_in_at!).getTime())[0]
    
    const lastActivity = latestUser?.last_sign_in_at ? 
      new Date(latestUser.last_sign_in_at).toLocaleDateString() : 
      'No recent activity'

    const result = {
      totalUsers: totalProfiles, // Mostrar usuarios con perfil como el número principal
      totalProfiles,
      totalPositions,
      adminUsers,
      lastActivity,
      authUsersCount: totalAuthUsers, // Para información adicional
      confirmedUsers,
      debug: {
        totalAuthUsers,
        confirmedUsers,
        profilesCount: profiles?.length || 0,
        rankingsCount: rankings?.length || 0,
        adminCount: adminUsers,
        usersWithoutProfile: totalAuthUsers - totalProfiles,
        latestUserEmail: latestUser?.email,
        latestUserLastSignIn: latestUser?.last_sign_in_at
      },
      timestamp: new Date().toISOString()
    }

    console.log('📤 Returning stats:', result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to get admin stats', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
