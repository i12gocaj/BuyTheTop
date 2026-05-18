"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, Crown, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import PaymentForm from "@/components/payment-form"
import { sanitizeHtml } from "@/lib/validation"
import { formatCurrency } from "@/lib/utils"

interface ContributeFormProps {
  user: any
  userRanking: any
  userProfile: any
  suggestedAmount?: number | null
  onPaymentSuccess?: () => void
}

export default function ContributeForm({ user: _user, userRanking, userProfile: _userProfile, suggestedAmount, onPaymentSuccess }: ContributeFormProps) {
  const [amount, setAmount] = useState<number>(suggestedAmount || 1)
  const [inputValue, setInputValue] = useState<string>(suggestedAmount ? suggestedAmount.toString().replace('.', ',') : '1')
  const [showPayment, setShowPayment] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Update amount when suggestedAmount changes
  useEffect(() => {
    if (suggestedAmount) {
      setAmount(suggestedAmount)
      setInputValue(suggestedAmount.toString().replace('.', ','))
    }
  }, [suggestedAmount])

  const currentContribution = userRanking?.total_contribution || 0
  const currentPosition = userRanking?.current_position || null
  const newTotalContribution = currentContribution + amount

  const handleAmountChange = (value: string) => {
    // Sanitize input and validate
    let sanitizedValue = sanitizeHtml(value)
    
    // Convert dot to comma automatically (for users who try to use dot as decimal separator)
    if (sanitizedValue.includes('.')) {
      sanitizedValue = sanitizedValue.replace('.', ',')
    }
    
    // Always update the input value to show what user is typing (with comma format)
    setInputValue(sanitizedValue)
    
    // Handle empty or invalid input
    if (!sanitizedValue || sanitizedValue === '') {
      setAmount(0)
      return
    }
    
    // Allow partial input (like "1," or "1,5") without converting to number yet
    // Only validate when we have a complete number
    if (sanitizedValue.endsWith(',')) {
      // User is typing decimal separator, don't convert yet
      return
    }
    
    // Handle comma as decimal separator (Spanish format)
    // Replace comma with dot for parseFloat
    const normalizedValue = sanitizedValue.replace(',', '.')
    
    const numValue = Number.parseFloat(normalizedValue)
    
    // Handle NaN or invalid numbers
    if (isNaN(numValue)) {
      return // Don't update amount if the value is invalid
    }
    
    // Validate bounds
    if (numValue < 0) {
      setAmount(0)
    } else {
      // Round to 2 decimal places to avoid floating point precision issues
      setAmount(Math.round(numValue * 100) / 100)
    }
  }

  const setQuickAmount = (value: number) => {
    // Validate quick amount
    if (value >= 1) {
      setAmount(value)
      setInputValue(value.toString().replace('.', ','))
    }
  }



  const handleProceedToPayment = () => {
    // Validate amount before proceeding
    if (amount >= 1) {
      setShowPayment(true)
      setPaymentMessage(null)
    } else {
      setPaymentMessage({
        type: "error",
        message: "Please enter an amount of at least 1,00 €"
      })
    }
  }

  const handlePaymentSuccess = (message?: string) => {
    setPaymentMessage({ type: "success", message: message || "Payment successful!" })
    setShowPayment(false)
    // Call parent's refresh function
    if (onPaymentSuccess) {
      setTimeout(() => {
        onPaymentSuccess()
      }, 1000)
    }
  }

  const handlePaymentError = (error: string) => {
    setPaymentMessage({ type: "error", message: error })
    setShowPayment(false)
  }

  const handlePaymentCancel = () => {
    setShowPayment(false)
    setPaymentMessage(null)
  }

  if (showPayment) {
    return <PaymentForm amount={amount} onSuccess={handlePaymentSuccess} onError={handlePaymentError} onCancel={handlePaymentCancel} />
  }

  return (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardHeader>
        <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
          <Coins className="mr-2 h-6 w-6" />
          Make Your Contribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {paymentMessage && (
          <Alert
            className={
              paymentMessage.type === "error"
                ? "border-red-700/50 bg-red-900/20"
                : "border-green-700/50 bg-green-900/20"
            }
          >
            <AlertCircle className={`h-4 w-4 ${paymentMessage.type === "error" ? "text-red-400" : "text-green-400"}`} />
            <AlertDescription className={paymentMessage.type === "error" ? "text-red-400" : "text-green-400"}>
              {paymentMessage.message}
            </AlertDescription>
          </Alert>
        )}

        {suggestedAmount && (
          <Alert className="border-[#c9a96e]/50 bg-[#c9a96e]/10">
            <Crown className="h-4 w-4 text-[#c9a96e]" />
            <AlertDescription className="text-[#c9a96e]">
              This amount will help you overtake your target position. You can adjust it if needed.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Status */}
        <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
          <h3 className="text-lg font-semibold text-[#c9a96e] mb-2">Your Current Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8a8a8a]">Current Position:</span>
              <span className="text-[#e5e5e5]">{currentPosition ? `#${currentPosition}` : "Not ranked"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a8a8a]">Total Contributed:</span>
              <span className="text-[#e5e5e5]">{formatCurrency(currentContribution)}</span>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-[#c9a96e]">
            Contribution Amount (EUR)
          </label>
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            pattern="[0-9]+(,[0-9]{1,2})?"
            value={inputValue}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="bg-[#0a0a0a] border-[#333] text-[#e5e5e5] text-lg h-12 focus:border-[#c9a96e] focus:ring-[#c9a96e]"
            placeholder="1,00"
            required
          />
          <p className="text-xs text-[#666666] mt-1">
            Minimum contribution: 1,00 €
          </p>
        </div>

        {/* Quick Amount Buttons */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#c9a96e]">Quick Amounts</label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10, 25, 50, 100, 250, 500].map((value) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickAmount(value)}
                className={`
                  bg-[#1a1a1a] border-[#333] text-[#8a8a8a] 
                  hover:bg-[#c9a96e] hover:border-[#c9a96e] hover:text-[#0a0a0a] 
                  transition-all duration-200 ease-in-out
                  ${amount === value 
                    ? "bg-[#c9a96e] border-[#c9a96e] text-[#0a0a0a] font-semibold" 
                    : ""
                  }
                `}
              >
                {value},00 €
              </Button>
            ))}
          </div>
        </div>

        {/* Contribution Preview */}
        {amount >= 1 && (
          <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
            <h3 className="text-lg font-semibold text-[#c9a96e] mb-2">After This Contribution</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8a8a8a]">New Total:</span>
                <span className="text-[#e5e5e5] font-semibold">{formatCurrency(newTotalContribution)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Rules */}
        <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
          <h3 className="text-sm font-semibold text-[#c9a96e] mb-2">Ranking Rules</h3>
          <ul className="text-xs text-[#8a8a8a] space-y-1">
            <li>• Minimum contribution: 1,00 €</li>
            <li>• To surpass someone, contribute at least 0,01 € more than their total</li>
            <li>• In case of equal contributions, later contributors rank lower</li>
            <li>• Your position updates immediately after successful payment</li>
          </ul>
        </div>

        <Button
          onClick={handleProceedToPayment}
          disabled={amount < 1}
          className="w-full bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] py-6 text-lg font-medium rounded-lg h-[60px] font-serif"
        >
          <Crown className="mr-2 h-5 w-5" />
          Proceed to Payment - {formatCurrency(amount)}
        </Button>
      </CardContent>
    </Card>
  )
}
