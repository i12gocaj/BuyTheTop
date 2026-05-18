"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Crown, CheckCircle, XCircle, Loader2, Mail } from "lucide-react"
import Link from "next/link"

function ConfirmEmailChangeContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const confirmEmailChange = async () => {
      try {
        const token = searchParams.get('code') || searchParams.get('token') // Support both for compatibility
        const email = searchParams.get('new_email')

        if (!token || !email) {
          setStatus('error')
          setMessage('Invalid confirmation link. Missing required parameters.')
          return
        }

        setNewEmail(email)
        console.log('📧 Confirming email change with code:', { email })

        const response = await fetch('/api/auth/confirm-email-change', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, new_email: email })
        })

        const result = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(result.success || 'Email updated successfully')
          
          // Redirect to profile after 4 seconds
          setTimeout(() => {
            router.push('/profile?email_updated=true')
          }, 4000)
        } else {
          setStatus('error')
          setMessage(result.error || 'Error confirming email change')
        }
      } catch (error) {
        console.error('📧 Error confirming email change:', error)
        setStatus('error')
        setMessage('Unexpected error. Please try again.')
      }
    }

    confirmEmailChange()
  }, [searchParams, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Crown className="h-16 w-16 text-[#c9a96e] animate-pulse" />
          </div>
          <div className="space-y-2">
            <Loader2 className="h-8 w-8 text-[#c9a96e] animate-spin mx-auto" />
            <h1 className="text-2xl font-bold text-[#e5e5e5]">Confirming email change...</h1>
            <p className="text-[#8a8a8a]">This will only take a moment</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/profile">
            <Button variant="ghost" className="text-[#8a8a8a] hover:text-[#c9a96e] hover:bg-[#1a1a1a]">
              ← Back to profile
            </Button>
          </Link>
        </div>

        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="space-y-4">
              <div className="flex justify-center">
                <Crown className="h-16 w-16 text-[#c9a96e]" />
              </div>
              
              {status === 'success' ? (
                <>
                  <div className="flex justify-center">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                  <h1 className="text-3xl font-bold text-[#e5e5e5]">Email updated!</h1>
                  <p className="text-[#8a8a8a] text-lg">{message}</p>
                  
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 space-y-4">
                    <div className="flex justify-center">
                      <Mail className="h-8 w-8 text-[#c9a96e]" />
                    </div>
                    <h2 className="text-xl font-semibold text-[#c9a96e]">Email updated successfully</h2>
                    <div className="space-y-2">
                      <p className="text-[#e5e5e5]">Your new email is:</p>
                      <p className="text-[#c9a96e] font-mono text-lg bg-[#0a0a0a] px-4 py-2 rounded border border-[#333]">
                        {newEmail}
                      </p>
                    </div>
                    <p className="text-[#8a8a8a] text-sm">You will be redirected to your profile...</p>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      onClick={() => router.push('/profile?email_updated=true')}
                      className="w-full bg-[#c9a96e] hover:bg-[#d4b577] text-black font-semibold py-6 text-lg rounded-lg h-[60px]"
                    >
                      Go to my profile
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/')}
                      className="w-full border-[#333] text-[#c9a96e] hover:bg-[#1a1a1a] hover:text-[#c9a96e] py-6 text-lg font-medium rounded-lg h-[60px] bg-transparent"
                    >
                      View ranking
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <XCircle className="h-12 w-12 text-red-500" />
                  </div>
                  <h1 className="text-3xl font-bold text-[#e5e5e5]">Confirmation error</h1>
                  <p className="text-red-400 text-lg">{message}</p>
                  
                  <div className="bg-[#2a1f1f] border border-[#4a2f2f] rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-[#ffa500]">What can you do?</h2>
                    <div className="text-left space-y-2 text-[#e5e5e5]">
                      <p>• Verify that the link is complete</p>
                      <p>• Try from the original email</p>
                      <p>• Request a new change if expired</p>
                      <p>• Contact support if the problem persists</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      onClick={() => router.push('/profile')}
                      className="w-full bg-[#c9a96e] hover:bg-[#d4b577] text-black font-semibold py-6 text-lg rounded-lg h-[60px]"
                    >
                      Back to profile
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/contact')}
                      className="w-full border-[#333] text-[#c9a96e] hover:bg-[#1a1a1a] hover:text-[#c9a96e] py-6 text-lg font-medium rounded-lg h-[60px] bg-transparent"
                    >
                      Contact support
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmEmailChangePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#c9a96e] animate-spin" />
      </div>
    }>
      <ConfirmEmailChangeContent />
    </Suspense>
  )
}
