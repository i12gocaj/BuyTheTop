"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Crown, CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

function ConfirmPageContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-confirmed'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const confirmAccount = async () => {
      try {
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (!token || !type) {
          setStatus('error')
          setMessage('Invalid confirmation link. Missing required parameters.')
          return
        }

        console.log('🔐 Confirming account with token and type:', { type })
        console.log('🔐 Making POST request to DEBUG API...')

        const response = await fetch('/api/auth/confirm-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, type })
        })

        console.log('🔐 API Response status:', response.status, response.statusText)
        const result = await response.json()
        console.log('🔐 API Response data:', result)

        if (response.ok) {
          console.log('🔐 Confirmation successful!')
          if (result.alreadyConfirmed) {
            console.log('🔐 Account was already confirmed')
            setStatus('already-confirmed')
            setMessage('Your account is already active and confirmed!')
          } else {
            console.log('🔐 Account newly confirmed')
            setStatus('success')
            setMessage(result.success || 'Account confirmed successfully')
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
              console.log('🔐 Redirecting to login...')
              router.push('/auth/login?confirmed=true')
            }, 3000)
          }
        } else {
          console.error('🔐 Confirmation failed:', result)
          setStatus('error')
          setMessage(result.error || 'Error confirming account')
        }
      } catch (error) {
        console.error('🔐 Error confirming account:', error)
        setStatus('error')
        setMessage('Unexpected error. Please try again.')
      }
    }

    confirmAccount()
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
            <h1 className="text-2xl font-bold text-[#e5e5e5]">Confirming your account...</h1>
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
          <Link href="/">
            <Button variant="ghost" className="text-[#8a8a8a] hover:text-[#c9a96e] hover:bg-[#1a1a1a]">
              ← Back to home
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
                  <h1 className="text-3xl font-bold text-[#e5e5e5]">Account confirmed!</h1>
                  <p className="text-[#8a8a8a] text-lg">{message}</p>
                  
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-[#c9a96e]">Welcome to BuyTheTop!</h2>
                    <p className="text-[#8a8a8a] text-sm">You will be redirected automatically...</p>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      onClick={() => router.push('/auth/login?confirmed=true')}
                      className="w-full bg-[#c9a96e] hover:bg-[#d4b577] text-black font-semibold py-6 text-lg rounded-lg h-[60px]"
                    >
                      Sign in now
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
              ) : status === 'already-confirmed' ? (
                <>
                  <div className="flex justify-center">
                    <CheckCircle className="h-12 w-12 text-blue-500" />
                  </div>
                  <h1 className="text-3xl font-bold text-[#e5e5e5]">Account already active!</h1>
                  <p className="text-[#8a8a8a] text-lg">{message}</p>
                  
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-[#c9a96e]">Your account is ready</h2>
                    <p className="text-[#8a8a8a]">You can sign in and start using all features.</p>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      onClick={() => router.push('/auth/login')}
                      className="w-full bg-[#c9a96e] hover:bg-[#d4b577] text-black font-semibold py-6 text-lg rounded-lg h-[60px]"
                    >
                      Sign in now
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
                      <p>• Request a new link if it has expired</p>
                      <p>• Contact support if the problem persists</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      onClick={() => router.push('/auth/sign-up')}
                      className="w-full bg-[#c9a96e] hover:bg-[#d4b577] text-black font-semibold py-6 text-lg rounded-lg h-[60px]"
                    >
                      Sign up again
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

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#c9a96e] animate-spin" />
      </div>
    }>
      <ConfirmPageContent />
    </Suspense>
  )
}
