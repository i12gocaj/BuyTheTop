import { createClient } from '@supabase/supabase-js'

// Utility functions to ensure position consistency

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

/**
 * Recalculates all ranking positions based on total_contribution
 * This ensures consistency across the entire rankings table
 * For ties: first user to reach that contribution level keeps higher position
 */
export async function recalculateAllRankingPositions(): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    // Get all rankings ordered by total_contribution (descending), 
    // then by position_acquired_at (ascending) for tie-breaking
    const { data: allRankings, error: fetchError } = await supabaseAdmin
      .from('rankings')
      .select('user_id, total_contribution, current_position, position_acquired_at, created_at')
      .order('total_contribution', { ascending: false })
      .order('position_acquired_at', { ascending: true })

    if (fetchError) {
      return { success: false, updatedCount: 0, error: fetchError.message }
    }

    if (!allRankings || allRankings.length === 0) {
      return { success: true, updatedCount: 0 }
    }

    let updatedCount = 0

    // Update each ranking with its correct position (sequential, no ties)
    for (let i = 0; i < allRankings.length; i++) {
      const ranking = allRankings[i]
      const correctPosition = i + 1

      // Only update if position is different
      if (ranking.current_position !== correctPosition) {
        const { error: updateError } = await supabaseAdmin
          .from('rankings')
          .update({ current_position: correctPosition })
          .eq('user_id', ranking.user_id)

        if (updateError) {
          console.error(`Failed to update position for user ${ranking.user_id}:`, updateError)
        } else {
          updatedCount++
        }
      }
    }

    return { success: true, updatedCount }
  } catch (error) {
    console.error('Error recalculating positions:', error)
    return { success: false, updatedCount: 0, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Calculates the correct position for a user based on their total contribution
 * For ties: new user goes below existing users with same contribution
 */
export async function calculateUserPosition(totalContribution: number): Promise<{ position: number; error?: string }> {
  try {
    // Count users with HIGHER contribution
    const { count: higherCount, error: higherError } = await supabaseAdmin
      .from('rankings')
      .select('*', { count: 'exact', head: true })
      .gt('total_contribution', totalContribution)

    if (higherError) {
      return { position: 1, error: higherError.message }
    }

    // Count users with EQUAL contribution (they all go before this new user)
    const { count: equalCount, error: equalError } = await supabaseAdmin
      .from('rankings')
      .select('*', { count: 'exact', head: true })
      .eq('total_contribution', totalContribution)

    if (equalError) {
      return { position: 1, error: equalError.message }
    }

    // Position = users with higher contribution + users with equal contribution + 1
    return { position: (higherCount || 0) + (equalCount || 0) + 1 }
  } catch (error) {
    console.error('Error calculating position:', error)
    return { position: 1, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Calculates the correct position for an existing user whose contribution has been updated
 * This triggers a full recalculation to maintain proper ordering
 */
export async function calculateUpdatedUserPosition(userId: string, newTotalContribution: number): Promise<{ position: number; error?: string }> {
  try {
    // Update the user's contribution first
    const { error: updateError } = await supabaseAdmin
      .from('rankings')
      .update({ 
        total_contribution: newTotalContribution,
        position_acquired_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      return { position: 1, error: updateError.message }
    }

    // Recalculate all positions to maintain proper order
    const recalcResult = await recalculateAllRankingPositions()
    if (!recalcResult.success) {
      return { position: 1, error: recalcResult.error }
    }

    // Get the user's new position
    const { data: userRanking, error: fetchError } = await supabaseAdmin
      .from('rankings')
      .select('current_position')
      .eq('user_id', userId)
      .single()

    if (fetchError || !userRanking) {
      return { position: 1, error: fetchError?.message || 'User not found' }
    }

    return { position: userRanking.current_position || 1 }
  } catch (error) {
    console.error('Error calculating updated position:', error)
    return { position: 1, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Validates that a position history entry makes sense
 */
export function validatePositionHistoryEntry(entry: {
  contribution_amount: number
  old_position: number | null
  new_position: number
}): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  // Check for unreasonably small contributions leading to top positions
  if (entry.contribution_amount < 50 && entry.new_position <= 3) {
    issues.push('Small contribution (<50,00 €) leading to top 3 position')
  }

  // Check for impossible position jumps with small contributions
  if (entry.old_position && entry.new_position < entry.old_position) {
    const positionJump = entry.old_position - entry.new_position
    if (positionJump > 10 && entry.contribution_amount < 500) {
      issues.push(`Large position jump (${positionJump}) with small contribution (<500,00 €)`)
    }
  }

  // Check for extremely small contributions
  if (entry.contribution_amount <= 1) {
    issues.push('Contribution amount too small (≤1,00 €)')
  }

  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * Robust function to recalculate all ranking positions
 * Ensures sequential positions without gaps
 * Only updates users with contributions > 0
 */
export async function recalculateAllPositionsRobust(): Promise<{ 
  success: boolean; 
  updatedCount: number; 
  totalPositions: number;
  error?: string 
}> {
  try {
    console.log('🔧 Starting robust position recalculation...')

    // Get all rankings with contributions > 0, ordered by contribution (desc), then by acquisition time (asc) for ties
    const { data: rankings, error: fetchError } = await supabaseAdmin
      .from('rankings')
      .select('user_id, total_contribution, current_position, position_acquired_at')
      .gt('total_contribution', 0)
      .order('total_contribution', { ascending: false })
      .order('position_acquired_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching rankings for recalculation:', fetchError)
      return { 
        success: false, 
        updatedCount: 0, 
        totalPositions: 0,
        error: fetchError.message 
      }
    }

    if (!rankings || rankings.length === 0) {
      console.log('No rankings to recalculate')
      return { success: true, updatedCount: 0, totalPositions: 0 }
    }

    let updatedCount = 0

    // Update each position sequentially to ensure no gaps
    for (let i = 0; i < rankings.length; i++) {
      const correctPosition = i + 1
      const ranking = rankings[i]
      
      if (ranking.current_position !== correctPosition) {
        const { error: updateError } = await supabaseAdmin
          .from('rankings')
          .update({ 
            current_position: correctPosition,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', ranking.user_id)

        if (updateError) {
          console.error(`Error updating position ${correctPosition} for user ${ranking.user_id}:`, updateError)
          return { 
            success: false, 
            updatedCount, 
            totalPositions: rankings.length,
            error: `Failed to update position ${correctPosition}` 
          }
        }

        updatedCount++
        console.log(`Updated user ${ranking.user_id.substring(0, 8)}... to position #${correctPosition}`)
      }
    }

    console.log(`✅ Position recalculation completed. Updated ${updatedCount} of ${rankings.length} positions.`)
    
    return { 
      success: true, 
      updatedCount,
      totalPositions: rankings.length 
    }

  } catch (error) {
    console.error('Position recalculation failed:', error)
    return { 
      success: false, 
      updatedCount: 0, 
      totalPositions: 0,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
