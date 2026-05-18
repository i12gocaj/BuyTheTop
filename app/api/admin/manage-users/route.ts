export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export async function GET(_request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verificar si es admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Crear cliente admin
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

    // Obtener usuarios con sus perfiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      return NextResponse.json({ error: 'Failed to get profiles' }, { status: 500 })
    }

    // Obtener datos de auth para emails
    const { data: authUsers, error: authError2 } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError2) {
      return NextResponse.json({ error: 'Failed to get auth users' }, { status: 500 })
    }

    // Combinar datos
    const usersData = profiles?.map(profile => {
      const authUser = authUsers.users.find(u => u.id === profile.id)
      return {
        id: profile.id,
        email: authUser?.email || 'No email',
        display_name: profile.display_name,
        description: profile.description,
        avatar_url: profile.avatar_url,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_sign_in_at: authUser?.last_sign_in_at,
        email_confirmed: !!authUser?.email_confirmed_at
      }
    }) || []

    return NextResponse.json({
      users: usersData,
      total: usersData.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('User management error:', error)
    return NextResponse.json({ 
      error: 'Failed to get users', 
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

    // Obtener datos del request
    const { userId, action, data } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 })
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
      case 'update_profile':
        const { error: updateError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            display_name: data.display_name,
            description: data.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) {
          return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
        }
        result = { message: 'Profile updated successfully' }
        break

      case 'change_role':
        const { error: roleError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            role: data.role,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (roleError) {
          return NextResponse.json({ error: 'Failed to change role' }, { status: 500 })
        }
        result = { message: 'Role changed successfully' }
        break

      case 'remove_avatar':
        const { error: avatarError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            avatar_url: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (avatarError) {
          return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 })
        }
        result = { message: 'Avatar removed successfully' }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('User management error:', error)
    return NextResponse.json({ 
      error: 'Failed to process action', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
