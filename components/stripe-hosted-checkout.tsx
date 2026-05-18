"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, CheckCircle, AlertCircle, ArrowLeft, ExternalLink } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAnalytics, useCampaignTracking } from "@/hooks/use-analytics"

interface StripeHostedCheckoutProps {
  amount: number
  onSuccess?: (message?: string) => void
  onError?: (error: string) => void
  onCancel?: () => void
  isLoading?: boolean
  setIsLoading?: (loading: boolean) => void
}

export default function StripeHostedCheckout({ 
  amount, 
  onSuccess, 
  onError, 
  onCancel, 
  isLoading, 
  setIsLoading 
}: StripeHostedCheckoutProps) {
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [hasAcceptedNoRefunds, setHasAcceptedNoRefunds] = useState(false)
  
  // Analytics hooks
  const { trackEvent, trackCTAClick } = useAnalytics()
  const { trackConversion } = useCampaignTracking()

  const handleCheckout = async () => {
    if (!hasAcceptedNoRefunds) {
      setError('You must accept the no-refunds policy before proceeding.')
      return
    }

    try {
      setProcessing(true)
      setIsLoading?.(true)
      setError(null)
      console.log('🔄 Starting Stripe Hosted Checkout for amount:', amount)
      
      // Track begin_checkout event
      trackEvent('begin_checkout', {
        currency: 'EUR',
        value: amount,
        payment_amount: amount,
        page_section: 'payment_form'
      })
      
      // Check authentication first
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error('❌ Supabase client not available')
        throw new Error('Authentication service not available')
      }

      console.log('🔍 Checking user session...')
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) {
        console.error('❌ Auth error:', authError)
        throw new Error(`Authentication error: ${authError.message}`)
      }

      if (!session?.user) {
        console.error('❌ No user session found')
        throw new Error('Please log in to continue with payment')
      }

      console.log('✅ User authenticated:', session.user.email)

      // Create checkout session
      console.log('🔄 Creating checkout session...')
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Checkout session creation failed:', data)
        throw new Error(data.error || 'Failed to create checkout session')
      }

      console.log('✅ Checkout session created:', data.sessionId)

      // Track add_payment_info event
      trackEvent('add_payment_info', {
        currency: 'EUR',
        value: amount,
        payment_type: 'stripe_checkout'
      })

      // Redirect to Stripe Checkout
      if (data.url) {
        console.log('🔄 Redirecting to Stripe Checkout...')
        
        // Track campaign conversion if applicable
        trackConversion(amount)
        
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }

    } catch (err) {
      console.error('❌ Checkout error:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
      setProcessing(false)
      setIsLoading?.(false)
    }
  }

  if (processing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#c9a96e]" />
            <p className="text-white">Redirecting to secure checkout...</p>
            <p className="text-sm text-gray-400">
              You will be redirected to Stripe's secure payment page
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="bg-[#2a2a2a] rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-[#c9a96e] font-medium">
            <CreditCard className="h-4 w-4" />
            Secure Payment with Stripe
          </div>
          <p className="text-sm text-gray-300">
            You'll be redirected to Stripe's secure checkout page where you can pay with:
          </p>
          <ul className="text-sm text-gray-400 space-y-1 ml-4">
            <li>• Credit or debit cards</li>
            <li>• Digital wallets (Apple Pay, Google Pay)</li>
            <li>• Bank transfers and other local payment methods</li>
          </ul>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle className="h-3 w-3" />
            <span>PCI DSS compliant • SSL encrypted • Secure</span>
          </div>
        </div>

        {/* No Refunds Agreement */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <input
                type="checkbox"
                id="no-refunds-agreement"
                checked={hasAcceptedNoRefunds}
                onChange={(e) => setHasAcceptedNoRefunds(e.target.checked)}
                className="w-4 h-4 rounded border-red-400 bg-transparent text-red-500 focus:ring-red-500 focus:ring-offset-0"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="no-refunds-agreement" className="text-sm text-red-200 cursor-pointer">
                <span className="font-medium text-red-100">I understand and accept that:</span>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• All contributions are final and absolutely non-refundable</li>
                  <li>• I waive my right to withdrawal under EU consumer protection laws</li>
                  <li>• No refunds will be processed for any reason whatsoever</li>
                  <li>• I have read and agree to the Terms & Conditions</li>
                </ul>
              </label>
            </div>
          </div>
        </div>

        <Button
          onClick={() => {
            // Track CTA click before processing
            trackCTAClick({
              button_text: `Continue to Secure Checkout - €${amount}`,
              button_location: 'payment_form',
              destination_url: 'stripe_checkout'
            })
            handleCheckout()
          }}
          disabled={processing || isLoading || !hasAcceptedNoRefunds}
          className="w-full bg-[#c9a96e] hover:bg-[#b8956a] text-black font-medium py-3 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing || isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Continue to Secure Checkout - €{amount}
            </>
          )}
        </Button>

        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full border-[#333] bg-transparent text-[#c9a96e] hover:bg-[#2a2a2a] hover:border-[#c9a96e] hover:text-[#c9a96e]"
            disabled={processing || isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>

      <div className="text-xs text-gray-500 text-center">
        Powered by{' '}
        <a 
          href="https://stripe.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#635bff] hover:underline"
        >
          Stripe
        </a>
      </div>
    </div>
  )
}
