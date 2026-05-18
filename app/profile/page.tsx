"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { checkAndCreateUserProfile } from "@/lib/profile-utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"
import ProfileForm from "@/components/profile-form"
import EmailChangeForm from "@/components/email-change-form"
import UserStats from "@/components/user-stats"
import PaymentHistory from "@/components/payment-history"
import PositionHistory from "@/components/position-history"
import PositionAlerts from "@/components/position-alerts"
import { SupportInfo } from "@/components/support-info"

interface AuthUser {
  id: string
  email: string
  role?: string
  isAdmin?: boolean
}

// Componente separado para manejar searchParams
function ProfilePageContent() {
  const searchParams = useSearchParams()
  const emailChanged = searchParams.get('email_changed') === 'true'
  const shouldReload = searchParams.get('reload') === 'true'
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userRanking, setUserRanking] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [positionHistory, setPositionHistory] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  
  // Cache para evitar recargas innecesarias
  const lastUserIdRef = useRef<string>('')
  const lastFetchTimeRef = useRef<number>(0)
  const CACHE_DURATION = 30000 // 30 segundos

  // Effect to handle page reload when coming from email callback
  useEffect(() => {
    if (emailChanged && shouldReload) {
      console.log('🔄 Email change callback detected, cleaning URL and reloading...')
      
      // Clean the URL parameters and reload the page to get fresh session
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      
      // Force reload after a brief delay
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }, [emailChanged, shouldReload])

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured) {
          setLoading(false)
          return
        }

        const supabase = getSupabaseClient()
        if (!supabase) {
          setLoading(false)
          return
        }

        // Get current user (always fresh from server)
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (currentUser) {
          console.log('🔄 Initializing user:', { 
            id: currentUser.id.substring(0, 8) + '...',
            email: currentUser.email 
          })

          // Get user role
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single()

          setUser({
            id: currentUser.id,
            email: currentUser.email || '',
            role: profile?.role || 'user',
            isAdmin: profile?.role === 'admin'
          })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  // Add auth state change listener to detect email updates
  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log('🔄 Auth state change:', { event, hasSession: !!session })
        
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          if (session?.user && user) {
            // Check if email has changed
            if (session.user.email !== user.email) {
              console.log('🔄 Email change detected via auth state:', {
                oldEmail: user.email,
                newEmail: session.user.email
              })

              // Get user role
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

              setUser({
                id: session.user.id,
                email: session.user.email || '',
                role: profile?.role || 'user',
                isAdmin: profile?.role === 'admin'
              })
            }
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [user?.email])

  // Effect to refresh user data when email change is confirmed
  useEffect(() => {
    if (emailChanged) {
      console.log('🔄 Email change confirmed, refreshing user data...')
      
      const refreshUserData = async () => {
        try {
          const supabase = getSupabaseClient()
          if (!supabase) return

          // Wait a moment for Supabase to process the change
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Force refresh the user session
          const { data: { user: refreshedUser }, error } = await supabase.auth.getUser()
          
          if (error) {
            console.error('🔄 Failed to refresh user:', error)
            return
          }

          if (refreshedUser) {
            console.log('🔄 User refreshed after email change:', {
              previousEmail: user?.email,
              newEmail: refreshedUser.email,
              userUpdated: refreshedUser.email !== user?.email
            })

            // Get user role
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('role')
              .eq('id', refreshedUser.id)
              .single()

            setUser({
              id: refreshedUser.id,
              email: refreshedUser.email || '',
              role: profile?.role || 'user',
              isAdmin: profile?.role === 'admin'
            })

            console.log('✅ User state updated with new email:', refreshedUser.email)
          }
        } catch (error) {
          console.error('🔄 Error refreshing user after email change:', error)
        }
      }

      refreshUserData()
    }
  }, [emailChanged]) // Remove user dependency to trigger on email change detection

  useEffect(() => {
    const initUserData = async () => {
      // No redirigir inmediatamente, dar tiempo a la autenticación
      if (loading) return
      
    if (!user) {
        // Esperar un poco más antes de redirigir
        const timeoutId = setTimeout(() => {
      // Evita re-render del árbol tras logout
      window.location.replace("/auth/login")
        }, 1000)
        return () => clearTimeout(timeoutId)
      }

      if (user) {
        // Asegurar que el usuario tenga un perfil
        try {
          await checkAndCreateUserProfile({ id: user.id, email: user.email } as any)
        } catch (error) {
          console.error('Error creating user profile:', error)
        }
        
        // Solo recargar si es un usuario diferente o ha pasado tiempo suficiente
        const now = Date.now()
        if (lastUserIdRef.current !== user.id || now - lastFetchTimeRef.current > CACHE_DURATION) {
          loadUserData()
          lastUserIdRef.current = user.id
          lastFetchTimeRef.current = now
        }
      }
    }

    initUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

  const loadUserData = async () => {
    if (!user) return

    const supabase = getSupabaseClient()
    if (!supabase) return

    try {
      setDataLoading(true)

      // Get user profile
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle() // Usar maybeSingle() en lugar de single()
      
      console.log("Profile data from database:", profileData)

      // Get user ranking
      const { data: rankingData, error: rankingError } = await supabase
        .from("rankings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle() // Usar maybeSingle() en lugar de single()
      
      if (rankingError) console.error("Ranking fetch error:", rankingError)

      // Get payment history
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)
      
      if (paymentsError) console.error("Payment fetch error:", paymentsError)

      // Get position history - handle gracefully if table doesn't exist
      let positionData = []
      try {
        const response = await fetch('/api/position-history', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const result = await response.json()
          positionData = result.data || []
        } else {
          console.warn("Position history API returned error:", response.status)
          // Continue with empty array
        }
      } catch (error) {
        console.error("Position history fetch failed:", error)
        // Continue with empty array
      }

      setUserProfile(profileData)
      setUserRanking(rankingData)
      setPayments(paymentsData || [])
      setPositionHistory(positionData || [])
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setDataLoading(false)
    }
  }

  if (loading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a96e]"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-[#8a8a8a] hover:text-[#c9a96e] hover:bg-[#1a1a1a]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Ranking
            </Button>
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#c9a96e] mb-4 font-serif">Your Profile</h1>
          <p className="text-xl text-[#8a8a8a]">Manage your presence in the ascension</p>
        </div>

        {/* Email change success message */}
        {emailChanged && (
          <Alert className="border-green-700/50 bg-green-900/20 mb-6">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              Your email address has been successfully updated!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Forms */}
          <div className="lg:col-span-1 space-y-6">
            <ProfileForm user={user} userProfile={userProfile} />
            <EmailChangeForm currentEmail={user.email} />
          </div>

          {/* Right Column - Stats and History */}
          <div className="lg:col-span-2 space-y-8">
            <UserStats user={user} userRanking={userRanking} userProfile={userProfile} />
            <PositionAlerts user={user} userRanking={userRanking} />
            <PaymentHistory payments={payments} />
            <PositionHistory positionHistory={positionHistory} />
            
            {/* Support Information */}
            <SupportInfo compact={true} className="mt-8" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente principal con Suspense boundary
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a96e] mx-auto mb-4"></div>
          <p className="text-[#8a8a8a]">Loading profile...</p>
        </div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  )
}
