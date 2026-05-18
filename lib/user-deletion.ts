/**
 * Utilidades para eliminación completa de usuarios
 * Incluye funciones para eliminar usuarios y todos sus datos relacionados
 */

import { createClient } from '@supabase/supabase-js'

export interface UserDeletionResult {
  success: boolean
  deletedData: {
    profile: boolean
    ranking: boolean
    payments: boolean
    positionHistory: boolean
    authUser: boolean
  }
  errors: string[]
  userId: string
}

/**
 * Elimina completamente a un usuario y todos sus datos relacionados
 * @param userId - ID del usuario a eliminar
 * @param supabaseAdmin - Cliente admin de Supabase
 * @returns Resultado de la eliminación
 */
export async function deleteUserCompletely(
  userId: string,
  supabaseAdmin: any
): Promise<UserDeletionResult> {
  console.log(`🗑️ Iniciando eliminación completa del usuario: ${userId}`)
  
  const result: UserDeletionResult = {
    success: false,
    deletedData: {
      profile: false,
      ranking: false,
      payments: false,
      positionHistory: false,
      authUser: false
    },
    errors: [],
    userId
  }

  try {
    // 1. Eliminar de user_profiles
    console.log('🔄 Eliminando perfil de usuario...')
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId)
    
    if (profileError) {
      console.error('❌ Error eliminando perfil:', profileError.message)
      result.errors.push(`Profile deletion failed: ${profileError.message}`)
    } else {
      console.log('✅ Perfil eliminado exitosamente')
      result.deletedData.profile = true
    }

    // 2. Eliminar de rankings
    console.log('🔄 Eliminando posición del ranking...')
    const { error: rankingError } = await supabaseAdmin
      .from('rankings')
      .delete()
      .eq('user_id', userId)
    
    if (rankingError) {
      console.error('❌ Error eliminando ranking:', rankingError.message)
      result.errors.push(`Ranking deletion failed: ${rankingError.message}`)
    } else {
      console.log('✅ Posición del ranking eliminada exitosamente')
      result.deletedData.ranking = true
    }

    // 3. Eliminar de payments
    console.log('🔄 Eliminando historial de pagos...')
    const { error: paymentsError } = await supabaseAdmin
      .from('payments')
      .delete()
      .eq('user_id', userId)
    
    if (paymentsError) {
      console.error('❌ Error eliminando pagos:', paymentsError.message)
      result.errors.push(`Payments deletion failed: ${paymentsError.message}`)
    } else {
      console.log('✅ Historial de pagos eliminado exitosamente')
      result.deletedData.payments = true
    }

    // 4. Eliminar de position_history (si existe)
    console.log('🔄 Eliminando historial de posiciones...')
    const { error: positionHistoryError } = await supabaseAdmin
      .from('position_history')
      .delete()
      .eq('user_id', userId)
    
    if (positionHistoryError) {
      if (positionHistoryError.message.includes('does not exist')) {
        console.log('ℹ️ Tabla position_history no existe, saltando...')
        result.deletedData.positionHistory = true
      } else {
        console.error('❌ Error eliminando historial de posiciones:', positionHistoryError.message)
        result.errors.push(`Position history deletion failed: ${positionHistoryError.message}`)
      }
    } else {
      console.log('✅ Historial de posiciones eliminado exitosamente')
      result.deletedData.positionHistory = true
    }

    // 5. Eliminar de auth.users (ÚLTIMO PASO)
    console.log('🔄 Eliminando usuario de autenticación...')
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (authError) {
      console.error('❌ Error eliminando usuario de auth:', authError.message)
      result.errors.push(`Auth user deletion failed: ${authError.message}`)
    } else {
      console.log('✅ Usuario de autenticación eliminado exitosamente')
      result.deletedData.authUser = true
    }

    // Determinar si la eliminación fue exitosa
    const deletedCount = Object.values(result.deletedData).filter(deleted => deleted).length
    const totalOperations = Object.keys(result.deletedData).length
    
    result.success = deletedCount >= 4 // Al menos profile, ranking, payments y authUser deben eliminarse
    
    console.log(`📊 Eliminación completa: ${deletedCount}/${totalOperations} operaciones exitosas`)

  } catch (error) {
    console.error('❌ Error general durante la eliminación:', error)
    result.errors.push(`General deletion error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

/**
 * Obtiene información del usuario antes de eliminarlo (para logs/auditoría)
 * @param userId - ID del usuario
 * @param supabaseAdmin - Cliente admin de Supabase
 */
export async function getUserInfoForDeletion(
  userId: string,
  supabaseAdmin: any
): Promise<{
  profile: any | null
  ranking: any | null
  authUser: any | null
}> {
  try {
    // Obtener perfil
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Obtener ranking
    const { data: ranking } = await supabaseAdmin
      .from('rankings')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Obtener usuario de auth
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)

    return {
      profile,
      ranking,
      authUser: authUser.user
    }
  } catch (error) {
    console.error('Error obteniendo información del usuario:', error)
    return {
      profile: null,
      ranking: null,
      authUser: null
    }
  }
}
