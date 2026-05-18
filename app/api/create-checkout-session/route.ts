export const runtime = 'edge'

import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { PaymentIntentSchema } from "@/lib/validation"
import { checkRateLimit, getRateLimitHeaders, rateLimitConfigs } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import { logPaymentEvent, logRateLimitHit, logSecurityEvent } from "@/lib/audit-logger"

export async function POST(request: NextRequest) {
  try {
    console.log("Creating checkout session...")
    console.log("Stripe secret key present:", !!process.env.STRIPE_SECRET_KEY)
    
    // Apply rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 'localhost'
    const rateLimitResult = checkRateLimit(ip, 'payment')
    if (!rateLimitResult.allowed) {
      logRateLimitHit(request, 'payment')
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: getRateLimitHeaders(
          rateLimitResult.remaining,
          rateLimitResult.resetTime,
          rateLimitConfigs.payment.maxRequests
        )
      })
    }
    
    // Verify Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || !stripe) {
      console.error("STRIPE_SECRET_KEY not found or Stripe not initialized")
      logSecurityEvent('error', 'Payment service not configured')
      return NextResponse.json({ error: "Payment service not configured" }, { status: 500 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = PaymentIntentSchema.parse(body)
    const { amount } = validatedData

    console.log("Validated amount:", amount)

    // Verify authentication using Supabase server client
    console.log("🔍 Verifying authentication...")
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log("❌ Authentication failed:", authError?.message)
      logSecurityEvent('warn', 'Unauthenticated payment attempt', { amount })
      return NextResponse.json(
        { error: "Authentication required" }, 
        { 
          status: 401,
          headers: getRateLimitHeaders(
            rateLimitResult.remaining,
            rateLimitResult.resetTime,
            rateLimitConfigs.payment.maxRequests
          )
        }
      )
    }

    console.log("✅ User authenticated successfully:", user.id, user.email)

    console.log("Creating Stripe Checkout Session for amount:", amount)

    // Get the origin from the request
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'BuyTheTop Contribution',
              description: 'Support the platform and track your investments',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/contribute?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/contribute?canceled=true`,
      customer_email: user.email || undefined,
      metadata: {
        userId: user.id,
        userEmail: user.email || '',
      },
      payment_intent_data: {
        metadata: {
          userId: user.id,
          userEmail: user.email || '',
        },
      },
      billing_address_collection: 'auto',
    })

    console.log("Checkout Session created successfully:", checkoutSession.id)

    // Log successful checkout session creation
    await logPaymentEvent(request, 'PAYMENT_CREATED', user.id, checkoutSession.id, amount)
    logSecurityEvent('info', 'Checkout session created', { 
      userId: user.id, 
      amount, 
      sessionId: checkoutSession.id 
    })

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      amount: amount,
    }, {
      headers: getRateLimitHeaders(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
        rateLimitConfigs.payment.maxRequests
      )
    })
  } catch (error) {
    console.error("Checkout session creation error:", error)
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: "Invalid request data", details: error.message },
        { status: 400 }
      )
    }

    // Handle rate limit errors
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      await logRateLimitHit(request, 'payment')
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      )
    }

    // Handle auth errors
    if (error instanceof Error && (
      error.message.includes('Authentication required') ||
      error.message.includes('Admin access required')
    )) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Admin') ? 403 : 401 }
      )
    }

    return NextResponse.json(
      { 
        error: "Failed to create checkout session",
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          'Internal server error'
      }, 
      { status: 500 }
    )
  }
}
