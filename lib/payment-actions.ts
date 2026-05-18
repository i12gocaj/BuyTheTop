"use server"

import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils"

export async function processContribution(prevState: any, formData: FormData) {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Authentication required" }
    }

    // Validate form data
    const userId = formData.get("userId") as string
    const amountStr = formData.get("amount") as string

    if (!userId || !amountStr) {
      return { error: "Missing required fields" }
    }

    const amount = Number.parseFloat(amountStr)

    if (isNaN(amount) || amount < 1) {
      return { error: "Minimum contribution is 1,00 €" }
    }

    if (userId !== user.id) {
      return { error: "Invalid user" }
    }

    // Create payment record
    const { data: _payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        amount: amount,
        status: "completed", // In a real app, this would be "pending" until Stripe confirms
        description: `Ranking contribution of ${formatCurrency(amount)}`,
      })
      .select()
      .single()

    if (paymentError) {
      console.error("Payment creation error:", paymentError)
      return { error: "Failed to process payment" }
    }

    // Update or create user ranking
    const { data: existingRanking } = await supabase.from("rankings").select("*").eq("user_id", userId).single()

    const newTotalContribution = (existingRanking?.total_contribution || 0) + amount
    
    // Calculate current position before update
    const { count: currentPosition } = await supabase
      .from("rankings")
      .select("*", { count: "exact", head: true })
      .gt("total_contribution", existingRanking?.total_contribution || 0)

    // Calculate new position after update
    const { count: newPosition } = await supabase
      .from("rankings")
      .select("*", { count: "exact", head: true })
      .gt("total_contribution", newTotalContribution)

    const oldPos = existingRanking ? (currentPosition || 0) + 1 : null
    const newPos = (newPosition || 0) + 1

    // Recalculate all positions after this update
    async function recalculateAllPositions() {
      // Get all rankings ordered by total_contribution (descending)
      const { data: allRankings } = await supabase
        .from("rankings")
        .select("user_id, total_contribution")
        .order("total_contribution", { ascending: false })

      if (allRankings) {
        // Update each ranking with its correct position
        for (let i = 0; i < allRankings.length; i++) {
          await supabase
            .from("rankings")
            .update({ current_position: i + 1 })
            .eq("user_id", allRankings[i].user_id)
        }
      }
    }

    if (existingRanking) {
      // Update existing ranking
      const { error: updateError } = await supabase
        .from("rankings")
        .update({
          total_contribution: newTotalContribution,
          current_position: newPos,
          position_acquired_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (updateError) {
        console.error("Ranking update error:", updateError)
        return { error: "Failed to update ranking" }
      }
    } else {
      // Create new ranking
      const { error: insertError } = await supabase.from("rankings").insert({
        user_id: userId,
        total_contribution: newTotalContribution,
        current_position: newPos,
        position_acquired_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Ranking creation error:", insertError)
        return { error: "Failed to create ranking" }
      }
    }

    // Recalculate all positions to ensure consistency
    await recalculateAllPositions()

    // Insert position history record
    const { error: positionHistoryError } = await supabase
      .from("position_history")
      .insert({
        user_id: userId,
        old_position: oldPos,
        new_position: newPos,
        contribution_amount: amount,
        created_at: new Date().toISOString(),
      })

    if (positionHistoryError) {
      console.error("Position history error:", positionHistoryError)
      // Don't fail the entire operation, just log the error
    }

    // Create user profile if it doesn't exist
    const { data: existingProfile } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

    if (!existingProfile) {
      await supabase.from("user_profiles").insert({
        id: userId,
        display_name: user.email?.split("@")[0] || "Anonymous",
        position_notifications_enabled: true
      })
    }

    return {
      success: `Successfully contributed ${formatCurrency(amount)}! Your ranking has been updated.`,
    }
  } catch (error) {
    console.error("Contribution processing error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function calculatePositionPreview(userId: string, newTotalContribution: number) {
  const supabase = await createClient()

  try {
    // Count how many users have higher contributions
    const { count } = await supabase
      .from("rankings")
      .select("*", { count: "exact", head: true })
      .gt("total_contribution", newTotalContribution)

    // Count users with same contribution but earlier position_acquired_at
    const { count: tieCount } = await supabase
      .from("rankings")
      .select("*", { count: "exact", head: true })
      .eq("total_contribution", newTotalContribution)
      .neq("user_id", userId)

    const estimatedPosition = (count || 0) + (tieCount || 0) + 1

    return { position: estimatedPosition, error: null }
  } catch (error) {
    console.error("Position calculation error:", error)
    return { position: null, error: "Failed to calculate position" }
  }
}
