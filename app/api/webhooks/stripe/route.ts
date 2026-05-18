export const runtime = 'edge'

import { type NextRequest, NextResponse } from "next/server"
import Stripe from 'stripe'
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { recalculateAllRankingPositions, validatePositionHistoryEntry } from "@/lib/position-utils"
import { formatCurrency } from "@/lib/utils"

// Edge-compatible Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
  httpClient: Stripe.createFetchHttpClient()
})

// Configuración del webhook endpoint
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Create Supabase service client for admin operations
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  // Validar que existan las configuraciones necesarias
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event

  try {
    // ✅ Edge-compatible webhook verification
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    )
    
    console.log(`✅ Webhook event verified: ${event.type} (${event.id})`)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        console.log('🎉 Checkout session completed:', session.id)
        
        // Obtener detalles de la sesión desde Stripe
        let fullSession
        try {
          fullSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['payment_intent']
          })
        } catch (stripeError) {
          console.error('❌ Failed to retrieve session from Stripe:', stripeError)
          return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 })
        }
        
        if (!fullSession.metadata?.userId || !fullSession.amount_total) {
          console.error('❌ Missing required metadata in session:', {
            sessionId: fullSession.id,
            userId: fullSession.metadata?.userId,
            amount: fullSession.amount_total,
            metadata: fullSession.metadata
          })
          return NextResponse.json({ error: 'Invalid session data' }, { status: 400 })
        }

        const userId = fullSession.metadata.userId
        const paymentAmount = fullSession.amount_total / 100 // Convert from cents to euros
        const paymentIntentId = fullSession.payment_intent

        console.log('💰 Processing payment for user:', userId, 'amount:', paymentAmount)

        // Use service role client for admin operations
        const supabaseAdmin = createServiceRoleClient()

        // Check if payment already exists to prevent duplicates
        const paymentIntentIdStr = typeof paymentIntentId === 'string' ? paymentIntentId : paymentIntentId?.id
        const { data: existingPayment, error: checkError } = await supabaseAdmin
          .from("payments")
          .select("id, status")
          .eq("payment_intent_id", paymentIntentIdStr)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error("Error checking existing payment:", checkError)
          return NextResponse.json({ error: "Failed to check payment" }, { status: 500 })
        }

        if (existingPayment) {
          console.log(`⚠️ Payment already exists for payment_intent: ${paymentIntentIdStr}`)
          console.log(`   Existing payment ID: ${existingPayment.id}, Status: ${existingPayment.status}`)
          
          // If payment exists and is completed, skip processing
          if (existingPayment.status === 'completed') {
            console.log('✅ Payment already processed, skipping duplicate')
            return NextResponse.json({ received: true, message: 'Payment already processed' })
          }
        }

        // Create payment record only if it doesn't exist
        const { data: payment, error: paymentError } = await supabaseAdmin
          .from("payments")
          .insert({
            user_id: userId,
            amount: paymentAmount,
            status: "completed",
            payment_intent_id: paymentIntentIdStr,
            description: `Ranking contribution of ${formatCurrency(paymentAmount)}`,
          })
          .select()
          .single()

        if (paymentError) {
          console.error("❌ Payment creation error:", paymentError)
          return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
        }

        console.log('✅ Payment record created:', payment.id)

        // Update or create user ranking
        const { data: existingRanking } = await supabaseAdmin
          .from("rankings")
          .select("*")
          .eq("user_id", userId)
          .single()

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
            .eq("user_id", userId)

          if (updateError) {
            console.error("❌ Ranking update error:", updateError)
            return NextResponse.json({ error: "Failed to update ranking" }, { status: 500 })
          }
        } else {
          // Create new ranking
          const { error: insertError } = await supabaseAdmin
            .from("rankings")
            .insert({
              user_id: userId,
              total_contribution: newTotalContribution,
              current_position: newPos,
              position_acquired_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error("❌ Ranking creation error:", insertError)
            return NextResponse.json({ error: "Failed to create ranking" }, { status: 500 })
          }
        }

        console.log('✅ Ranking updated: user', userId, 'total:', newTotalContribution, 'position:', newPos)

        // Recalculate all positions to ensure consistency
        const recalcResult = await recalculateAllRankingPositions()
        if (!recalcResult.success) {
          console.error("❌ Position recalculation failed:", recalcResult.error)
        } else {
          console.log('✅ All positions recalculated successfully')
        }

        // Insert position history record with retry logic
        let positionInsertAttempts = 0;
        const maxRetries = 3;
        let positionHistoryError = null;
        
        while (positionInsertAttempts < maxRetries) {
          const { error } = await supabaseAdmin
            .from("position_history")
            .insert({
              user_id: userId,
              old_position: oldPos,
              new_position: newPos,
              contribution_amount: paymentAmount,
              created_at: new Date().toISOString(),
            })

          if (error) {
            positionInsertAttempts++;
            positionHistoryError = error;
            console.error(`❌ Position history error (attempt ${positionInsertAttempts}/${maxRetries}):`, error)
            
            if (positionInsertAttempts >= maxRetries) {
              // Log this critical error for manual review
              console.error("🚨 CRITICAL: Failed to insert position history after multiple attempts", {
                userId,
                paymentAmount,
                oldPos,
                newPos,
                sessionId: fullSession.id,
                error: error
              });
              
              break;
            } else {
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, positionInsertAttempts - 1)));
            }
          } else {
            console.log('✅ Position history recorded successfully')
            positionHistoryError = null;
            break;
          }
        }

        // If position history failed after all retries, we still continue processing
        // but log it as a critical issue that needs manual attention
        if (positionHistoryError) {
          console.error("🚨 CRITICAL: Position history insertion failed permanently for user", userId);
        }

        // Create user profile if it doesn't exist
        const { data: existingProfile } = await supabaseAdmin
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (!existingProfile) {
          // Get user email from metadata or try to fetch user details
          const userEmail = fullSession.metadata?.userEmail || fullSession.customer_details?.email
          const displayName = userEmail?.split("@")[0] || "Anonymous"
          
          await supabaseAdmin.from("user_profiles").insert({
            id: userId,
            display_name: displayName,
            position_notifications_enabled: true
          })
          console.log('✅ User profile created for:', userId)
        }

        console.log('🎉 Payment processing completed successfully!')
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log('✅ Payment intent succeeded:', paymentIntent.id)
        
        // For hosted checkout, we handle everything in checkout.session.completed
        // This is just for logging and backup
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object
        console.log('❌ Payment failed:', failedPayment.id)
        
        // Try to update payment record if it exists
        const supabaseForFailed = await createClient()
        await supabaseForFailed
          .from('payments')
          .update({ 
            status: 'failed'
          })
          .eq('payment_intent_id', failedPayment.id)
        break

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
