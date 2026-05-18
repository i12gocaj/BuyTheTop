"use client"

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Home, TrendingUp } from "lucide-react"
import Link from 'next/link'
import { useAnalytics, useCampaignTracking } from "@/hooks/use-analytics"

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const { trackEvent, trackPurchase } = useAnalytics()
  const { trackConversion } = useCampaignTracking()

  // Get parameters from URL
  const sessionId = searchParams.get('session_id')
  const amount = searchParams.get('amount')
  const paymentIntentId = searchParams.get('payment_intent')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && sessionId && amount) {
      const amountNumber = parseFloat(amount)

      // Track purchase completion
      trackPurchase({
        transaction_id: paymentIntentId || sessionId,
        value: amountNumber,
        currency: 'EUR',
        items: [
          {
            item_id: 'ranking_contribution',
            item_name: 'Ranking Contribution',
            item_category: 'premium_service',
            quantity: 1,
            price: amountNumber
          }
        ]
      })

      // Track campaign conversion
      trackConversion(amountNumber)

      // Track general purchase event
      trackEvent('purchase', {
        currency: 'EUR',
        value: amountNumber,
        transaction_id: paymentIntentId || sessionId,
        payment_method: 'stripe',
        item_category: 'ranking_contribution'
      })

      console.log('✅ Purchase tracked in Google Analytics:', {
        sessionId,
        amount: amountNumber,
        paymentIntentId
      })
    }
  }, [mounted, sessionId, amount, paymentIntentId, trackPurchase, trackConversion, trackEvent])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-[#1a1a1a] border-[#333]">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-serif text-[#c9a96e]">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div>
            <p className="text-lg text-white mb-2">
              Thank you for your contribution!
            </p>
            {amount && (
              <p className="text-3xl font-bold text-[#c9a96e]">
                €{amount}
              </p>
            )}
          </div>

          <div className="bg-[#2a2a2a] rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-300">
              Your payment has been processed successfully and your ranking position will be updated shortly.
            </p>
            {sessionId && (
              <p className="text-xs text-gray-400">
                Session ID: {sessionId}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full bg-[#c9a96e] hover:bg-[#b8956a] text-black font-medium">
                <Home className="mr-2 h-4 w-4" />
                View Rankings
              </Button>
            </Link>
            
            <Link href="/profile" className="block">
              <Button 
                variant="outline" 
                className="w-full border-[#333] bg-transparent text-[#c9a96e] hover:bg-[#2a2a2a] hover:border-[#c9a96e]"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                View My Profile
              </Button>
            </Link>
          </div>

          <div className="text-xs text-gray-500">
            <p>A confirmation email has been sent to your registered email address.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
