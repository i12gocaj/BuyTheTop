"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Crown, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

function getRedirectUrl(): string {
  // Forzar el dominio de producción si no estamos explícitamente en desarrollo local
  const isLocalDev = typeof window !== 'undefined' && 
                    (window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1') &&
                    process.env.NODE_ENV === 'development'
  
  if (isLocalDev) {
    return `${window.location.protocol}//${window.location.host}`
  }
  
  // Para todos los demás casos (incluyendo producción), usar el dominio de producción
  return 'https://buythetop.vip'
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<{
    error?: string
    success?: string
    isLoading?: boolean
  }>({})

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!email) {
      setState({ error: "Email is required" })
      return
    }

    setState({ isLoading: true, error: undefined, success: undefined })
    
    try {
      console.log('🔑 Password Reset: Starting password reset process...')
      
      // Usar nuestro sistema de email personalizado
      const response = await fetch('/api/auth/send-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('🔑 Password Reset: Error:', result.error)
        setState({ error: result.error || "Failed to send password reset email." })
      } else {
        console.log('🔑 Password Reset: Email sent successfully')
        setState({ 
          success: "We've sent you a professional password reset link. Please check your email." 
        })
      }
    } catch (error) {
      console.error('🔑 Password Reset: Unexpected error:', error)
      setState({ error: "An unexpected error occurred. Please try again." })
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <Crown className="h-12 w-12 text-[#c9a96e]" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-[#c9a96e] font-serif">
          Reset Password
        </h1>
        <p className="text-lg text-[#8a8a8a]">
          Enter your email to receive a password reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {state?.error && (
          <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>{state.error}</span>
            </div>
          </div>
        )}

        {state?.success && (
          <div className="bg-green-900/20 border border-green-700/50 text-green-400 px-4 py-3 rounded-lg text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>{state.success}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-[#c9a96e]">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] placeholder:text-[#666] focus:border-[#c9a96e] focus:ring-[#c9a96e]"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={state?.isLoading}
          className="w-full bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] py-6 text-lg font-medium rounded-lg h-[60px] font-serif"
        >
          {state?.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>

        <div className="text-center space-y-2">
          <Link 
            href="/auth/login" 
            className="inline-flex items-center text-[#8a8a8a] hover:text-[#c9a96e] font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  )
}
