"use client"

import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
  locale: 'en'
})

interface StripePaymentFormProps {
  amount: number
  onSuccess?: (message?: string) => void
  onError?: (error: string) => void
  onCancel?: () => void
  isLoading?: boolean
  setIsLoading?: (loading: boolean) => void
}

function CheckoutForm({ amount, onSuccess, onError, onCancel, isLoading, setIsLoading }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [hasAcceptedNoRefunds, setHasAcceptedNoRefunds] = useState(false)

  const initializePayment = async (): Promise<string> => {
    console.log('🔄 Initializing payment for amount:', amount)
    
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
      throw new Error('Authentication error: ' + authError.message)
    }
    
    if (!session) {
      console.error('❌ No active session')
      throw new Error('Please log in to continue with payment')
    }

    console.log('✅ User authenticated:', session.user?.email)

    // Get the access token for authentication
    const accessToken = session.access_token
    console.log('🔑 Access token available:', !!accessToken)

    // Create PaymentIntent with proper authentication
    console.log('📡 Creating payment intent...')
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ amount: amount }), // Send euros, backend converts to cents
    })

    console.log('📡 Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', errorText)
      
      if (response.status === 401) {
        throw new Error('Please log in to continue with payment')
      } else if (response.status === 429) {
        throw new Error('Too many payment attempts. Please try again later')
      } else {
        throw new Error(`Payment initialization failed: ${response.statusText}`)
      }
    }

    const data = await response.json()
    console.log('📦 Response data:', data)
    console.log('📦 Response data keys:', Object.keys(data))
    console.log('📦 ClientSecret present:', !!data.clientSecret)
    console.log('📦 ClientSecret value:', data.clientSecret ? 'pi_***' + data.clientSecret.slice(-10) : 'MISSING')
    
    if (data.error) {
      console.error('❌ Server error:', data.error)
      throw new Error(data.error)
    }

    if (!data.clientSecret) {
      console.error('❌ No clientSecret in response')
      console.error('❌ Full response data:', JSON.stringify(data, null, 2))
      throw new Error('Invalid payment response')
    }

    console.log('✅ Payment intent created successfully')
    setClientSecret(data.clientSecret)
    return data.clientSecret
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    console.log('🚀 Payment form submitted')
    
    if (!hasAcceptedNoRefunds) {
      setError('You must accept the no-refunds policy before proceeding.')
      onError?.('You must accept the no-refunds policy before proceeding.')
      return
    }

    console.log('🔍 Stripe available:', !!stripe)
    console.log('🔍 Elements available:', !!elements)

    if (!stripe || !elements) {
      console.error('❌ Stripe or Elements not ready')
      setError('Payment system not ready. Please refresh the page.')
      onError?.('Payment system not ready. Please refresh the page.')
      return
    }

    const card = elements.getElement(CardElement)

    if (card == null) {
      console.error('❌ Card element not found')
      return
    }

    console.log('✅ All validations passed, initializing and processing payment...')
    setError(null)
    setProcessing(true)
    setIsLoading?.(true)

    // Initialize payment if not already done
    let currentClientSecret = clientSecret
    if (!currentClientSecret) {
      try {
        currentClientSecret = await initializePayment()
        console.log('🔑 Got client secret:', currentClientSecret ? 'pi_***' + currentClientSecret.slice(-10) : 'MISSING')
      } catch (err) {
        console.error('❌ Payment initialization failed:', err)
        setError('Failed to initialize payment. Please try again.')
        setProcessing(false)
        setIsLoading?.(false)
        return
      }
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(currentClientSecret, {
      payment_method: {
        card: card,
      }
    })

    if (error) {
      setError(error.message || 'An unexpected error occurred.')
      onError?.(error.message || 'An unexpected error occurred.')
      setProcessing(false)
      setIsLoading?.(false)
    } else {
      console.log('✅ Payment succeeded, confirming with server...')
      
      // Confirm payment with our backend to update rankings
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        console.log('🔄 Confirming payment with server...', {
          paymentIntentId: paymentIntent.id,
          amount: amount,
          hasSession: !!session,
          hasAccessToken: !!session?.access_token
        })

        const confirmResponse = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            amount: amount.toString()
          }),
        })

        console.log('📡 Confirmation response status:', confirmResponse.status)
        console.log('📡 Confirmation response headers:', Object.fromEntries(confirmResponse.headers.entries()))

        if (!confirmResponse.ok) {
          const errorText = await confirmResponse.text()
          console.error('❌ Payment confirmation failed:', errorText)
          throw new Error('Payment processed but ranking update failed')
        }

        const confirmData = await confirmResponse.json()
        console.log('✅ Payment confirmed successfully:', confirmData)
        
        setError(null)
        setProcessing(false)
        setSucceeded(true)
        setIsLoading?.(false)
        onSuccess?.('Payment processed successfully! Your ranking has been updated.')
      } catch (confirmError) {
        console.error('❌ Payment confirmation error:', confirmError)
        const errorMsg = confirmError instanceof Error ? confirmError.message : 'Failed to update ranking'
        setError(`Payment successful but ${errorMsg}. Please <a href="/contact" style="color: #c9a96e; text-decoration: underline;">contact support</a>.`)
        setProcessing(false)
        setIsLoading?.(false)
        onError?.(errorMsg)
      }
    }
  }

  const cardStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'var(--font-source-sans), sans-serif',
        backgroundColor: 'transparent',
        '::placeholder': {
          color: '#888888',
        },
      },
      invalid: {
        color: '#ef4444',
      },
      complete: {
        color: '#c9a96e',
      },
    },
    hidePostalCode: true,
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-[#333] rounded-md bg-[#0f0f0f] focus-within:ring-2 focus-within:ring-[#c9a96e] focus-within:ring-offset-2 transition-all">
        <CardElement options={cardStyle} />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {succeeded && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
            🎉 Payment successful! Your contribution of {formatCurrency(amount)} has been added to your ranking.
          </AlertDescription>
        </Alert>
      )}

      {/* No Refunds Agreement */}
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <input
              type="checkbox"
              id="no-refunds-agreement-form"
              checked={hasAcceptedNoRefunds}
              onChange={(e) => setHasAcceptedNoRefunds(e.target.checked)}
              className="w-4 h-4 rounded border-red-400 bg-transparent text-red-500 focus:ring-red-500 focus:ring-offset-0"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="no-refunds-agreement-form" className="text-sm text-red-200 cursor-pointer">
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

      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              console.log('Cancel button clicked')
              onCancel?.()
            }}
            disabled={processing || isLoading}
            className="flex-1 bg-transparent border-[#333] text-[#c9a96e] hover:bg-[#2a2a2a] hover:border-[#c9a96e] hover:text-[#c9a96e] focus:text-[#c9a96e]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
        
        <Button
          type="submit"
          disabled={!stripe || processing || succeeded || isLoading || !hasAcceptedNoRefunds}
          className={`${onCancel ? "flex-1" : "w-full"} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {processing || isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay €{amount}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise} options={{ locale: 'en' }}>
      <CheckoutForm {...props} />
    </Elements>
  )
}
