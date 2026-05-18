// Data consistency validation utilities
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export interface ConsistencyValidationResult {
  isConsistent: boolean
  paymentTotal: number
  positionTotal: number
  rankingTotal: number
  difference: number
  missingEntries: number
  issues: string[]
}

/**
 * Validates payment-position-ranking consistency for a user
 */
export async function validateUserDataConsistency(userId: string): Promise<ConsistencyValidationResult> {
  const issues: string[] = []
  
  try {
    // Get completed payments
    const { data: payments, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed')

    if (paymentError) {
      throw new Error(`Failed to fetch payments: ${paymentError.message}`)
    }

    // Get position history
    const { data: positions, error: positionError } = await supabaseAdmin
      .from('position_history')
      .select('contribution_amount')
      .eq('user_id', userId)

    if (positionError) {
      throw new Error(`Failed to fetch position history: ${positionError.message}`)
    }

    // Get current ranking
    const { data: ranking, error: rankingError } = await supabaseAdmin
      .from('rankings')
      .select('total_contribution')
      .eq('user_id', userId)
      .single()

    if (rankingError && rankingError.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Failed to fetch ranking: ${rankingError.message}`)
    }

    // Calculate totals
    const paymentTotal = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0
    const positionTotal = positions?.reduce((sum, p) => sum + parseFloat(p.contribution_amount), 0) || 0
    const rankingTotal = ranking ? parseFloat(ranking.total_contribution) : 0

    // Check consistency
    const paymentPositionDiff = Math.abs(paymentTotal - positionTotal)
    const paymentRankingDiff = Math.abs(paymentTotal - rankingTotal)
    const positionRankingDiff = Math.abs(positionTotal - rankingTotal)

    if (paymentPositionDiff > 0.01) {
      issues.push(`Payment total (${paymentTotal}€) doesn't match position history total (${positionTotal}€)`)
    }

    if (paymentRankingDiff > 0.01) {
      issues.push(`Payment total (${paymentTotal}€) doesn't match ranking total (${rankingTotal}€)`)
    }

    if (positionRankingDiff > 0.01) {
      issues.push(`Position history total (${positionTotal}€) doesn't match ranking total (${rankingTotal}€)`)
    }

    const paymentCount = payments?.length || 0
    const positionCount = positions?.length || 0
    const missingEntries = paymentCount - positionCount

    if (missingEntries > 0) {
      issues.push(`Missing ${missingEntries} position history entries`)
    } else if (missingEntries < 0) {
      issues.push(`Extra ${Math.abs(missingEntries)} position history entries`)
    }

    return {
      isConsistent: issues.length === 0,
      paymentTotal,
      positionTotal,
      rankingTotal,
      difference: paymentTotal - rankingTotal,
      missingEntries,
      issues
    }

  } catch (error) {
    return {
      isConsistent: false,
      paymentTotal: 0,
      positionTotal: 0,
      rankingTotal: 0,
      difference: 0,
      missingEntries: 0,
      issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

/**
 * Repairs data inconsistencies for a user
 */
export async function repairUserDataInconsistency(userId: string): Promise<{
  success: boolean
  message: string
  repairsApplied: string[]
}> {
  const repairsApplied: string[] = []

  try {
    const validation = await validateUserDataConsistency(userId)
    
    if (validation.isConsistent) {
      return {
        success: true,
        message: 'No inconsistencies found',
        repairsApplied: []
      }
    }

    // Get detailed data for repair
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: true })

    const { data: positions } = await supabaseAdmin
      .from('position_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (!payments) {
      throw new Error('No payments found')
    }

    // Repair 1: Add missing position history entries
    if (validation.missingEntries > 0) {
      for (const payment of payments) {
        const hasMatchingPosition = positions?.some(pos => {
          const timeDiff = Math.abs(new Date(payment.created_at).getTime() - new Date(pos.created_at).getTime())
          const amountMatch = Math.abs(parseFloat(payment.amount) - parseFloat(pos.contribution_amount)) < 0.01
          return timeDiff < 300000 && amountMatch // Within 5 minutes and same amount
        })

        if (!hasMatchingPosition) {
          // This is a simplified repair - in production you'd need more sophisticated logic
          // to determine the correct old_position and new_position
          const { error: insertError } = await supabaseAdmin
            .from('position_history')
            .insert({
              user_id: userId,
              old_position: null, // Would need to calculate based on chronology
              new_position: 1, // Would need to calculate based on contribution
              contribution_amount: parseFloat(payment.amount),
              created_at: payment.created_at
            })

          if (!insertError) {
            repairsApplied.push(`Added missing position entry for ${payment.amount}€`)
          }
        }
      }
    }

    // Repair 2: Update ranking total
    if (Math.abs(validation.paymentTotal - validation.rankingTotal) > 0.01) {
      const { error: updateError } = await supabaseAdmin
        .from('rankings')
        .update({
          total_contribution: validation.paymentTotal,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (!updateError) {
        repairsApplied.push(`Updated ranking total to ${validation.paymentTotal}€`)
      }
    }

    return {
      success: true,
      message: `Applied ${repairsApplied.length} repairs`,
      repairsApplied
    }

  } catch (error) {
    return {
      success: false,
      message: `Repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      repairsApplied
    }
  }
}

/**
 * Validates all users data consistency (for batch operations)
 */
export async function validateAllUsersDataConsistency(): Promise<{
  totalUsers: number
  inconsistentUsers: Array<{
    userId: string
    validation: ConsistencyValidationResult
  }>
}> {
  try {
    // Get all users with rankings
    const { data: rankings, error } = await supabaseAdmin
      .from('rankings')
      .select('user_id')

    if (error) {
      throw new Error(`Failed to fetch rankings: ${error.message}`)
    }

    const inconsistentUsers: Array<{
      userId: string
      validation: ConsistencyValidationResult
    }> = []

    for (const ranking of rankings || []) {
      const validation = await validateUserDataConsistency(ranking.user_id)
      if (!validation.isConsistent) {
        inconsistentUsers.push({
          userId: ranking.user_id,
          validation
        })
      }
    }

    return {
      totalUsers: rankings?.length || 0,
      inconsistentUsers
    }

  } catch (error) {
    console.error('Validation error:', error)
    return {
      totalUsers: 0,
      inconsistentUsers: []
    }
  }
}
