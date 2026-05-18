export const runtime = 'edge'

import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { PaymentIntentSchema } from "@/lib/validation"
import { checkRateLimit, getRateLimitHeaders, rateLimitConfigs } from "@/lib/rate-limit"
import { verifyAuth } from "@/lib/auth-role-based"
import { logPaymentEvent, logRateLimitHit, logSecurityEvent } from "@/lib/audit-logger"

export async function POST(request: NextRequest) {
  try {
    console.log("Creating payment intent...")
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
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY not found")
      logSecurityEvent('error', 'Payment service not configured')
      return NextResponse.json({ error: "Payment service not configured" }, { status: 500 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = PaymentIntentSchema.parse(body)
    const { amount } = validatedData

    console.log("Validated amount:", amount)

    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.isAuthenticated || !authResult.user) {
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

    const user = authResult.user
    console.log("User authenticated successfully:", user.id)

    console.log("Creating Stripe PaymentIntent for amount:", amount)

    // Verify Stripe is configured
    if (!stripe) {
      console.error("Stripe not configured: STRIPE_SECRET_KEY is missing")
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      )
    }

    // Create Stripe PaymentIntent with automatic payment methods
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'eur',
      metadata: {
        userId: user.id,
        userEmail: user.email || '',
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
    })

    console.log("PaymentIntent created successfully:", paymentIntent.id)

    // Log successful payment creation
    await logPaymentEvent(request, 'PAYMENT_CREATED', user.id, paymentIntent.id, amount)
    logSecurityEvent('info', 'Payment intent created', { 
      userId: user.id, 
      amount, 
      paymentIntentId: paymentIntent.id 
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amount,
    }, {
      headers: getRateLimitHeaders(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
        rateLimitConfigs.payment.maxRequests
      )
    })
  } catch (error) {
    console.error("Payment intent creation error:", error)
    
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
        error: "Failed to create payment intent",
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          'Internal server error'
      }, 
      { status: 500 }
    )
  }
}
