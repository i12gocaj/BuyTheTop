"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, AlertCircle } from "lucide-react"
import StripeHostedCheckout from "@/components/stripe-hosted-checkout"

interface PaymentFormProps {
  amount: number
  onSuccess?: (message?: string) => void
  onError?: (error: string) => void
  onCancel?: () => void
}

export default function PaymentForm({ amount, onSuccess, onError, onCancel }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePaymentSuccess = (message?: string) => {
    setIsLoading(false)
    setError(null)
    onSuccess?.(message || "Payment successful!")
  }

  const handlePaymentError = (errorMessage: string) => {
    setIsLoading(false)
    setError(errorMessage)
    onError?.(errorMessage)
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-[#1a1a1a] border-[#333]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#c9a96e] font-serif">
          <CreditCard className="h-5 w-5" />
          Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="text-center">
          <p className="text-2xl font-bold text-white">€{amount}</p>
          <p className="text-sm text-gray-400">Total amount</p>
        </div>

        <StripeHostedCheckout
          amount={amount}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={onCancel}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </CardContent>
    </Card>
  )
}
