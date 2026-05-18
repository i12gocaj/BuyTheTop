"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Crown, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

function ResetPasswordFormContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [state, setState] = useState<{
    error?: string
    success?: string
    isLoading?: boolean
  }>({})
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Permitir el flujo con code y type=recovery
    const code = searchParams.get('code')
    const type = searchParams.get('type')
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')

    // Si es recovery y hay code, es válido
    if (type === 'recovery' && code) {
      setState((prev) => ({ ...prev, error: undefined }))
      return
    }
    // Si hay accessToken y refreshToken, también es válido
    if (accessToken && refreshToken) {
      setState((prev) => ({ ...prev, error: undefined }))
      return
    }
    // Si no, mostrar el error
    setState({ 
      error: "Your password reset link is invalid or expired. Please request a new link from the login page."
    })
  }, [searchParams])

  const validatePasswords = () => {
    // Puedes personalizar los requisitos aquí
    const requirements = []
    if (password.length < 8) {
      requirements.push("at least 8 characters")
    }
    if (!/[A-Z]/.test(password)) {
      requirements.push("one uppercase letter")
    }
    if (!/[a-z]/.test(password)) {
      requirements.push("one lowercase letter")
    }
    if (!/[0-9]/.test(password)) {
      requirements.push("one number")
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>/?]/.test(password)) {
      requirements.push("one special character")
    }
    if (requirements.length > 0) {
      setState({ error: `Password must contain: ${requirements.join(", ")}` })
      return false
    }
    if (password !== confirmPassword) {
      setState({ error: "Passwords do not match" })
      return false
    }
    return true
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!validatePasswords()) {
      return
    }

    setState({ isLoading: true, error: undefined, success: undefined })
    
    try {
      console.log('🔑 Reset Password: Starting password reset process...')
      const { supabase } = await import('@/lib/supabase/client')
      
      if (!supabase) {
        console.error('🔑 Reset Password: Supabase client not available')
        setState({ error: "Service not available. Please try again later." })
        return
      }

      // Get recovery parameters
      const code = searchParams.get('code')
      const type = searchParams.get('type')

      if (!code || type !== 'recovery') {
        setState({ error: "Invalid recovery link. Please request a new password reset." })
        return
      }

      // Use verifyOtp for password recovery instead of updateUser
      const { error } = await supabase.auth.verifyOtp({
        token_hash: code,
        type: 'recovery'
      })

      if (error) {
        console.error('🔑 Reset Password: OTP verification error:', error)
        setState({ error: "Invalid or expired reset link. Please request a new password reset." })
        return
      }

      // Now update the password with the temporary session
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })
      
      if (updateError) {
        console.error('🔑 Reset Password: Password update error:', updateError)
        setState({ error: updateError.message })
      } else {
        console.log('🔑 Reset Password: Password updated successfully')
        
        // Sign out immediately to clear the temporary session
        await supabase.auth.signOut()
        
        setState({ 
          success: "Password updated successfully! Redirecting to login..." 
        })
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch (error) {
      console.error('🔑 Reset Password: Unexpected error:', error)
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
          Set New Password
        </h1>
        <p className="text-lg text-[#8a8a8a]">
          Enter your new password below
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
            <label htmlFor="password" className="block text-sm font-medium text-[#c9a96e]">
              New Password
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] placeholder:text-[#666] focus:border-[#c9a96e] focus:ring-[#c9a96e] pr-10"
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

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#c9a96e]">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] placeholder:text-[#666] focus:border-[#c9a96e] focus:ring-[#c9a96e] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666] hover:text-[#c9a96e]"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={state?.isLoading || !!state?.success}
          className="w-full bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] py-6 text-lg font-medium rounded-lg h-[60px] font-serif"
        >
          {state?.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating password...
            </>
          ) : (
            "Update Password"
          )}
        </Button>
      </form>
    </div>
  )
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a96e] mx-auto"></div>
      </div>
    }>
      <ResetPasswordFormContent />
    </Suspense>
  )
}
