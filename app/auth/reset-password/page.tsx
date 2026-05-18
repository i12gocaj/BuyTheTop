"use client"

import { useEffect, useState, Suspense } from "react"
import { supabase } from "@/lib/supabase/client"
import ResetPasswordForm from "@/components/reset-password-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

function ResetPasswordContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(true)
  const [hasValidTokens, setHasValidTokens] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!supabase) {
          setIsConfigured(false)
          setIsLoading(false)
          return
        }

        // IMPORTANT: Clear any existing session to prevent auto-login during password reset
        console.log('🔑 Reset Password: Clearing any existing session to prevent auto-login')
        await supabase.auth.signOut()

        // Check for code (from URL callback) or direct tokens
        const code = searchParams.get('code')
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')
        const error = searchParams.get('error')
        const errorCode = searchParams.get('error_code')

        // Handle error cases (like expired token)
        if (error || errorCode) {
          console.log('🔑 Reset Password: Error in URL:', { error, errorCode })
          setHasValidTokens(false)
          setIsLoading(false)
          return
        }

        // Si es recovery y hay code, solo mostrar el formulario
        if (code && type === 'recovery') {
          console.log('🔑 Reset Password: Valid recovery code found - showing reset form WITHOUT creating session')
          setHasValidTokens(true)
        } else {
          console.log('🔑 Reset Password: No valid reset tokens found in URL')
          console.log('🔑 Reset Password: Params:', { code: !!code, type, accessToken: !!accessToken, refreshToken: !!refreshToken })
          setHasValidTokens(false)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setIsConfigured(false)
        setHasValidTokens(false)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a96e]"></div>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <h1 className="text-2xl font-bold mb-4 text-[#c9a96e]">Connect Supabase to get started</h1>
      </div>
    )
  }

  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const isExpired = errorCode === 'otp_expired' || error === 'access_denied'
  
  const handleBackToLogin = async () => {
    // Clear any existing session before going to login
    if (supabase) {
      await supabase.auth.signOut()
    }
    window.location.href = '/auth/login'
  }

  const handleRequestNewReset = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    window.location.href = '/auth/forgot-password'
  }
  
  if (!hasValidTokens) {
    
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="text-[#8a8a8a] hover:text-[#c9a96e] hover:bg-[#1a1a1a]">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Ranking
              </Button>
            </Link>
          </div>

          <div className="flex min-h-[80vh] items-center justify-center">
            <div className="w-full max-w-md space-y-8 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight text-[#c9a96e] font-serif">
                  {isExpired ? 'Reset Link Expired' : 'Invalid Reset Link'}
                </h1>
                <p className="text-lg text-[#8a8a8a]">
                  {isExpired 
                    ? 'Your password reset link has expired. Please request a new one.'
                    : 'This password reset link is invalid or has expired.'
                  }
                </p>
              </div>
              <div className="space-y-4">
                <Button 
                  onClick={handleRequestNewReset}
                  className="w-full bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] py-6 text-lg font-medium rounded-lg h-[60px] font-serif">
                  Request New Reset Link
                </Button>
                <Button 
                  onClick={handleBackToLogin}
                  variant="outline" 
                  className="w-full border-[#333] text-[#c9a96e] hover:bg-[#1a1a1a] hover:text-[#c9a96e] py-6 text-lg font-medium rounded-lg h-[60px] bg-transparent"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="text-[#8a8a8a] hover:text-[#c9a96e] hover:bg-[#1a1a1a]"
            onClick={async () => {
              if (supabase) {
                await supabase.auth.signOut();
              }
              window.location.href = "/";
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Ranking
          </Button>
        </div>

        <div className="flex min-h-[80vh] items-center justify-center">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a96e]"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
