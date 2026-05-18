"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Crown, Eye, EyeOff, AlertCircle } from "lucide-react"
import Link from "next/link"

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] py-6 text-lg font-medium rounded-lg h-[60px] font-serif"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Entering the realm...
        </>
      ) : (
        "Enter the Ranking"
      )}
    </Button>
  )
}

export default function LoginForm() {
  const [state, setState] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const searchParams = useSearchParams()

  // Check for URL error parameters
  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')
    
    if (error === 'email_not_confirmed' && message) {
      setState({
        error: message,
        emailNotConfirmed: true
      })
    }
  }, [searchParams])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    
    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    try {
      console.log('🔑 Login: Using corrected API route...')
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      const result = await response.json()
      
      console.log('🔑 Login: API response:', result)
      
      if (!response.ok) {
        console.error('🔑 Login: Authentication error:', result.error)
        setState({
          error: result.error,
          emailNotConfirmed: result.emailNotConfirmed
        })
      } else {
        console.log('🔑 Login: Success! User confirmed and logged in')
        setState({ success: result.success, user: result.user })
        window.location.href = "/"
      }
    } catch (error) {
      console.error('🔑 Login: Exception:', error)
      setState({ error: "An unexpected error occurred" })
    } finally {
      setPending(false)
    }
  }

  const isEmailNotConfirmed = state?.error?.includes('Email not confirmed') || 
                             state?.error?.includes('email_not_confirmed')

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <Crown className="h-12 w-12 text-[#c9a96e]" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-[#c9a96e] font-serif">BuyTheTop</h1>
        <p className="text-lg text-[#8a8a8a]">Enter your credentials to access the ranking</p>
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

        {isEmailNotConfirmed && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 text-yellow-400 px-4 py-3 rounded-lg text-sm">
            <div className="space-y-2">
              <p className="font-medium">Email not confirmed</p>
              <p className="text-xs">
                Please check your email for a confirmation link, or <Link href="/contact" className="text-[#c9a96e] hover:underline">contact support</Link> if you need help.
              </p>
              <p className="text-xs">
                Didn't receive the email? <button 
                  type="button" 
                  onClick={async () => {
                    const email = (document.getElementById('email') as HTMLInputElement)?.value
                    if (email) {
                      try {
                        const response = await fetch('/api/auth/send-confirmation', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email })
                        })
                        const result = await response.json()
                        if (response.ok) {
                          setState({ success: "Confirmation email sent. Please check your inbox." })
                        }
                      } catch (error) {
                        console.error('Error resending confirmation:', error)
                      }
                    }
                  }}
                  className="text-[#c9a96e] hover:underline"
                >
                  Resend confirmation email
                </button>
              </p>
            </div>
          </div>
        )}

        {state?.success && !state?.user && (
          <div className="bg-green-900/20 border border-green-700/50 text-green-400 px-4 py-3 rounded-lg text-sm">
            {state.success}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-[#c9a96e]">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              required
              className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] placeholder:text-[#666] focus:border-[#c9a96e] focus:ring-[#c9a96e]"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-[#c9a96e]">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] focus:border-[#c9a96e] focus:ring-[#c9a96e] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666] hover:text-[#c9a96e]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <SubmitButton pending={pending} />

        <div className="text-center space-y-3">
          <Link 
            href="/auth/forgot-password" 
            className="block text-sm text-[#8a8a8a] hover:text-[#c9a96e] underline"
          >
            Forgot your password?
          </Link>
          
          <div className="text-[#8a8a8a]">
            New to the realm?{" "}
            <Link href="/auth/sign-up" className="text-[#c9a96e] hover:underline font-medium">
              Join BuyTheTop
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

