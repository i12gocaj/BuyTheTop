import { getSupabaseClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

/**
 * Función utilitaria para asegurar que un usuario tenga un perfil en la base de datos
 * Se ejecuta independientemente del hook de autenticación para evitar dependencias circulares
 */
export async function ensureUserProfile(user: User): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('Supabase client not available')
      return false
    }

    // Verificar si el perfil existe
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!existingProfile) {
      console.log('🔨 Creating user profile for:', user.id)
      
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          display_name: user.email?.split('@')[0] || 'Usuario',
          role: 'user',
          position_notifications_enabled: true
        })
      
      if (error) {
        console.error('Error creating user profile:', error)
        return false
      } else {
        console.log('✅ User profile created successfully')
        return true
      }
    }

    // El perfil ya existe
    return true
  } catch (error) {
    console.error('Error ensuring user profile:', error)
    return false
  }
}

/**
 * Función para llamar en componentes que requieren un perfil de usuario
 * Se puede usar en useEffect de componentes específicos
 */
export async function checkAndCreateUserProfile(user: User | null): Promise<void> {
  if (!user) return
  
  // Ejecutar la creación del perfil de manera asíncrona sin bloquear la UI
  ensureUserProfile(user).catch(error => {
    console.error('Background profile creation failed:', error)
  })
}
