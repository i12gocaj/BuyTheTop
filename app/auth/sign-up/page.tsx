"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import SignUpForm from "@/components/sign-up-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      try {
        if (!supabase) {
          console.warn("Supabase client not available")
          setIsConfigured(false)
          return
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          window.location.replace("/")
          return
        }
      } catch (error) {
        console.error("Error checking session:", error)
        setIsConfigured(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

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
      </div>

      <div className="flex items-center justify-center px-4 pb-12 sm:px-6 lg:px-8">
        <SignUpForm />
      </div>
    </div>
  )
}
