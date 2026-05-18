export const runtime = 'edge'

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { stripe } from "@/lib/stripe"
import { recalculateAllRankingPositions, validatePositionHistoryEntry } from "@/lib/position-utils"
import { verifyAuth } from "@/lib/auth-role-based"
import { formatCurrency } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, amount } = await request.json()

    if (!paymentIntentId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify authentication using header
    const authResult = await verifyAuth(request)
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const user = authResult.user
    console.log("User verified:", user.id)

    // Use service role client to bypass RLS for payment operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (!paymentIntentId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify Stripe is configured
    if (!stripe) {
      console.error("Stripe not configured: STRIPE_SECRET_KEY is missing")
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      )
    }

    // Verify the payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Verify the amount matches
    const expectedAmount = Math.round(parseFloat(amount) * 100)
    console.log('💰 Amount verification:', {
      receivedAmount: amount,
      expectedAmountCents: expectedAmount,
      paymentIntentAmount: paymentIntent.amount,
      match: paymentIntent.amount === expectedAmount
    })
    
    if (paymentIntent.amount !== expectedAmount) {
      console.error('❌ Payment amount mismatch:', {
        expected: expectedAmount,
        received: paymentIntent.amount,
        difference: paymentIntent.amount - expectedAmount
      })
      return NextResponse.json({ 
        error: 'Payment amount mismatch',
        details: {
          expected: expectedAmount,
          received: paymentIntent.amount
        }
      }, { status: 400 })
    }
    const paymentAmount = Number.parseFloat(amount)

    // Check if payment already exists to prevent duplicates
    const { data: existingPayment, error: checkError } = await supabaseAdmin
      .from("payments")
      .select("id, status")
      .eq("payment_intent_id", paymentIntentId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking existing payment:", checkError)
      return NextResponse.json({ error: "Failed to check payment" }, { status: 500 })
    }

    if (existingPayment) {
      console.log(`⚠️ Payment already exists for payment_intent: ${paymentIntentId}`)
      console.log(`   Existing payment ID: ${existingPayment.id}, Status: ${existingPayment.status}`)
      
      // If payment exists and is completed, return success without creating duplicate
      if (existingPayment.status === 'completed') {
        console.log('✅ Payment already processed, returning existing payment info')
        return NextResponse.json({ 
          success: true, 
          message: "Payment already processed",
          paymentId: existingPayment.id
        })
      }
    }

    // Create payment record using admin client (bypasses RLS)
    const { data: _payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        amount: paymentAmount,
        status: "completed",
        payment_intent_id: paymentIntentId,
        description: `Ranking contribution of ${formatCurrency(paymentAmount)}`,
      })
      .select()
      .single()

    if (paymentError) {
      console.error("Payment creation error:", paymentError)
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
    }

    // Update or create user ranking
    const { data: existingRanking } = await supabaseAdmin.from("rankings").select("*").eq("user_id", user.id).single()

    const newTotalContribution = (existingRanking?.total_contribution || 0) + paymentAmount
    
    // Calculate current position before update
    const { count: currentPosition } = await supabaseAdmin
      .from("rankings")
      .select("*", { count: "exact", head: true })
      .gt("total_contribution", existingRanking?.total_contribution || 0)

    // Calculate new position after update
    const { count: newPosition } = await supabaseAdmin
      .from("rankings")
      .select("*", { count: "exact", head: true })
      .gt("total_contribution", newTotalContribution)
      
    const oldPos = existingRanking ? (currentPosition || 0) + 1 : null
    const newPos = (newPosition || 0) + 1



    if (existingRanking) {
      // Update existing ranking
      const { error: updateError } = await supabaseAdmin
        .from("rankings")
        .update({
          total_contribution: newTotalContribution,
          current_position: newPos,
          position_acquired_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (updateError) {
        console.error("Ranking update error:", updateError)
        return NextResponse.json({ error: "Failed to update ranking" }, { status: 500 })
      }
    } else {
      // Create new ranking
      const { error: insertError } = await supabaseAdmin.from("rankings").insert({
        user_id: user.id,
        total_contribution: newTotalContribution,
        current_position: newPos,
        position_acquired_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Ranking creation error:", insertError)
        return NextResponse.json({ error: "Failed to create ranking" }, { status: 500 })
      }
    }

    // Recalculate all positions to ensure consistency
    const recalcResult = await recalculateAllRankingPositions()
    if (!recalcResult.success) {
      console.error("Position recalculation failed:", recalcResult.error)
    }

    // Validate position history entry before insertion
    const historyEntry = {
      contribution_amount: paymentAmount,
      old_position: oldPos,
      new_position: newPos,
    }
    
    const validation = validatePositionHistoryEntry(historyEntry)
    if (!validation.valid) {
      console.warn("Invalid position history entry detected:", {
        user_id: user.id,
        issues: validation.issues,
        entry: historyEntry
      })
      // Still insert but log the issues for monitoring
    }

    // Insert position history record
    const { error: positionHistoryError } = await supabaseAdmin
      .from("position_history")
      .insert({
        user_id: user.id,
        old_position: oldPos,
        new_position: newPos,
        contribution_amount: paymentAmount,
        created_at: new Date().toISOString(),
      })

    if (positionHistoryError) {
      console.error("Position history error:", positionHistoryError)
      // Don't fail the entire operation, just log the error
    }

    // Create user profile if it doesn't exist
    const { data: existingProfile } = await supabaseAdmin.from("user_profiles").select("*").eq("id", user.id).single()

    if (!existingProfile) {
      await supabaseAdmin.from("user_profiles").insert({
        id: user.id,
        display_name: user.email?.split("@")[0] || "Anonymous",
        position_notifications_enabled: true
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully contributed ${formatCurrency(paymentAmount)}! Your ranking has been updated.`,
      newTotal: newTotalContribution,
    })
  } catch (error) {
    console.error("Payment confirmation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
