import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'

export interface PositionChange {
  userId: string
  userEmail: string
  userName: string
  oldPosition: number
  newPosition: number
  overtakenByName: string
}

/**
 * Detecta cambios de posición en el ranking y envía notificaciones
 */
export async function detectAndNotifyPositionChanges(): Promise<{
  success: boolean
  notificationsSent: number
  errors: string[]
}> {
  const errors: string[] = []
  let notificationsSent = 0

  try {
    const supabase = await createClient()

    // Obtener todas las posiciones actuales del ranking
    const { data: currentRankings, error: rankingError } = await supabase
      .from('rankings')
      .select(`
        user_id,
        current_position,
        total_contribution
      `)
      .not('current_position', 'is', null)
      .order('current_position', { ascending: true })

    if (rankingError) {
      errors.push(`Error getting current rankings: ${rankingError.message}`)
      return { success: false, notificationsSent: 0, errors }
    }

    if (!currentRankings || currentRankings.length === 0) {
      return { success: true, notificationsSent: 0, errors: [] }
    }

    // Obtener las posiciones anteriores almacenadas
    const { data: previousPositions, error: prevError } = await supabase
      .from('position_history')
      .select('user_id, position')
      .order('created_at', { ascending: false })

    if (prevError) {
      errors.push(`Error getting previous positions: ${prevError.message}`)
      return { success: false, notificationsSent: 0, errors }
    }

    // Crear un mapa de las posiciones anteriores (la más reciente por usuario)
    const previousPositionMap = new Map<string, number>()
    if (previousPositions) {
      for (const pos of previousPositions) {
        if (!previousPositionMap.has(pos.user_id)) {
          previousPositionMap.set(pos.user_id, pos.position)
        }
      }
    }

    // Detectar cambios de posición
    const positionChanges: PositionChange[] = []
    for (const ranking of currentRankings) {
      const previousPosition = previousPositionMap.get(ranking.user_id)
      
      // Solo notificar si había una posición anterior y empeoró
      if (previousPosition && ranking.current_position > previousPosition) {
        // Obtener información del usuario y verificar si tiene notificaciones habilitadas
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('display_name, position_notifications_enabled')
          .eq('id', ranking.user_id)
          .single()

        if (profileError) {
          errors.push(`Error getting profile for user ${ranking.user_id}: ${profileError.message}`)
          continue
        }

        // Solo proceder si las notificaciones están habilitadas
        if (!userProfile?.position_notifications_enabled) {
          continue
        }

        // Obtener el email del usuario de la tabla auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(ranking.user_id)
        
        if (authError || !authUser.user?.email) {
          errors.push(`Error getting auth user for ${ranking.user_id}: ${authError?.message || 'No email found'}`)
          continue
        }

        // Encontrar quién lo superó (la persona en la posición que tenía antes)
        const overtaker = currentRankings.find((r: any) => r.current_position === previousPosition)
        let overtakenByName = 'Un usuario'

        if (overtaker) {
          const { data: overtakerProfile } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', overtaker.user_id)
            .single()

          overtakenByName = overtakerProfile?.display_name || `Usuario ${overtaker.user_id.substring(0, 8)}`
        }

        positionChanges.push({
          userId: ranking.user_id,
          userEmail: authUser.user.email,
          userName: userProfile.display_name || `Usuario ${ranking.user_id.substring(0, 8)}`,
          oldPosition: previousPosition,
          newPosition: ranking.current_position,
          overtakenByName
        })
      }
    }

    // Enviar notificaciones
    for (const change of positionChanges) {
      try {
        const result = await emailService.sendPositionChangeNotification(
          change.userEmail,
          change.userName,
          change.oldPosition,
          change.newPosition,
          change.overtakenByName
        )

        if (result.success) {
          notificationsSent++
        } else {
          errors.push(`Failed to send notification to ${change.userEmail}: ${result.error}`)
        }
      } catch (error) {
        errors.push(`Error sending notification to ${change.userEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Actualizar el historial de posiciones para la próxima verificación
    const positionHistoryInserts = currentRankings.map((ranking: any) => ({
      user_id: ranking.user_id,
      position: ranking.current_position,
      total_contribution: ranking.total_contribution,
      created_at: new Date().toISOString()
    }))

    const { error: historyError } = await supabase
      .from('position_history')
      .insert(positionHistoryInserts)

    if (historyError) {
      errors.push(`Error updating position history: ${historyError.message}`)
    }

    return {
      success: errors.length === 0,
      notificationsSent,
      errors
    }

  } catch (error) {
    errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { success: false, notificationsSent: 0, errors }
  }
}

/**
 * Función para ser llamada periódicamente o después de actualizaciones del ranking
 */
export async function checkPositionChangesAndNotify() {
  console.log('🔍 Checking for position changes...')
  
  const result = await detectAndNotifyPositionChanges()
  
  if (result.success) {
    console.log(`✅ Position check completed. Notifications sent: ${result.notificationsSent}`)
  } else {
    console.error('❌ Position check failed:', result.errors)
  }

  if (result.errors.length > 0) {
    console.warn('⚠️ Position check warnings:', result.errors)
  }

  return result
}
