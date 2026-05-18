"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Crown, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [state, setState] = useState<{ error?: string; success?: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const validatePasswords = () => {
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long")
      return false
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return false
    }
    setPasswordError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!validatePasswords()) {
      return
    }

    setIsLoading(true)
    setState(null)
    setPasswordError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setState({ error: data.error })
      } else {
        setState({ success: data.success })
      }
    } catch (error) {
      console.error("Sign up error:", error)
      setState({ error: "An unexpected error occurred. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <Crown className="h-12 w-12 text-[#c9a96e]" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-[#c9a96e] font-serif">BuyTheTop</h1>
        <p className="text-lg text-[#8a8a8a]">Create your account to enter the ranking</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {state?.error && (
          <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="bg-green-900/20 border border-green-700/50 text-green-400 px-4 py-3 rounded-lg text-sm">
            {state.success}
          </div>
        )}

        {passwordError && (
          <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {passwordError}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] focus:border-[#c9a96e] focus:ring-[#c9a96e] pr-10"
                placeholder="At least 6 characters"
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
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] focus:border-[#c9a96e] focus:ring-[#c9a96e] pr-10"
                placeholder="Repeat your password"
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
          disabled={isLoading}
          className="w-full bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] py-6 text-lg font-medium rounded-lg h-[60px] font-serif"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining the realm...
            </>
          ) : (
            "Start Climbing"
          )}
        </Button>

        <div className="text-center text-[#8a8a8a]">
          Already in the realm?{" "}
          <Link href="/auth/login" className="text-[#c9a96e] hover:underline font-medium">
            Enter Here
          </Link>
        </div>
      </form>
    </div>
  )
}
