"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { checkAndCreateUserProfile } from "@/lib/profile-utils"
import ContributeForm from "@/components/contribute-form"
import RankingPreview from "@/components/ranking-preview"
import { formatCurrency } from "@/lib/utils"

interface AuthUser {
  id: string
  email: string
  role?: string
  isAdmin?: boolean
}

function ContributePageContent() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [userRanking, setUserRanking] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [topRankings, setTopRankings] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'canceled' | null>(null)

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

        // Check for payment status from URL params
        const success = searchParams.get('success')
        const canceled = searchParams.get('canceled')
        const sessionId = searchParams.get('session_id')

        if (success === 'true') {
          setPaymentStatus('success')
          console.log('Payment successful, session ID:', sessionId)
          // Clean URL
          router.replace('/contribute', { scroll: false })
        } else if (canceled === 'true') {
          setPaymentStatus('canceled')
          // Clean URL
          router.replace('/contribute', { scroll: false })
        }

        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
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
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const loadUserData = useCallback(async () => {
    if (!user) return

    const supabase = getSupabaseClient()
    if (!supabase) return

    try {
      setDataLoading(true)

      // Get user's current ranking info
      const { data: rankingData } = await supabase
        .from("rankings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      // Get user profile
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      // Get top 5 rankings for preview
      const { data: topRankingsData, error: rankingsError } = await supabase
        .from("rankings")
        .select("*")
        .order("total_contribution", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(5)
        
      if (rankingsError) {
        console.error("Error fetching rankings:", rankingsError)
      }
      
      // If we have rankings, get the user profiles separately
      let enrichedRankings: any[] = []
      if (topRankingsData && topRankingsData.length > 0) {
        const userIds = topRankingsData.map((r: any) => r.user_id)
        const { data: profilesData } = await supabase
          .from("user_profiles")
          .select("id, display_name, description, avatar_url")
          .in("id", userIds)
          
        // Combine the data
        enrichedRankings = topRankingsData.map((ranking: any) => ({
          ...ranking,
          user_profiles: profilesData?.find((profile: any) => profile.id === ranking.user_id) || {
            display_name: 'User',
            description: null,
            avatar_url: null
          }
        }))
      }

      setUserRanking(rankingData)
      setUserProfile(profileData)
      setTopRankings(enrichedRankings)
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setDataLoading(false)
    }
  }, [user])

  useEffect(() => {
    const initUserData = async () => {
      // Don't redirect immediately, give time for authentication
      if (loading) return
    
    if (!user) {
        // Wait a bit longer before redirecting
        const timeoutId = setTimeout(() => {
      // Avoid problematic re-render
      window.location.replace("/auth/login")
        }, 1000)
        return () => clearTimeout(timeoutId)
      }      const supabase = getSupabaseClient()
      if (user && supabase) {
        // Ensure user has a profile
        try {
          await checkAndCreateUserProfile({ id: user.id, email: user.email } as any)
          loadUserData()
        } catch (error) {
          console.error('Error creating user profile:', error)
        }
      }
    }

    initUserData()
  }, [user, loading, loadUserData])

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

  // Calculate suggested amount if target is provided
  const targetAmount = searchParams.get('target') ? Number.parseFloat(searchParams.get('target')!) : null
  const suggestedAmount =
    targetAmount && userRanking ? Math.max(1, targetAmount - userRanking.total_contribution + 0.01) : null

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-[#8a8a8a] hover:text-[#c9a96e] hover:bg-[#1a1a1a]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Ranking
            </Button>
          </Link>
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#c9a96e] mb-4 font-serif">Buy Your Way to the Top</h1>
          <p className="text-xl text-[#8a8a8a] max-w-2xl mx-auto">
            Contribute to secure your position in the hierarchy. Every contribution matters in your journey to the top.
          </p>
          
          {/* Payment Status Messages */}
          {paymentStatus === 'success' && (
            <Alert className="mt-6 max-w-md mx-auto bg-green-900/20 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-300">
                Payment successful! Your contribution has been processed and your ranking will be updated shortly.
              </AlertDescription>
            </Alert>
          )}
          
          {paymentStatus === 'canceled' && (
            <Alert className="mt-6 max-w-md mx-auto bg-orange-900/20 border-orange-500/50">
              <XCircle className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-300">
                Payment was canceled. You can try again whenever you're ready.
              </AlertDescription>
            </Alert>
          )}
          
          {suggestedAmount && (
            <div className="mt-4 p-4 bg-[#c9a96e]/10 border border-[#c9a96e]/30 rounded-lg max-w-md mx-auto">
              <p className="text-[#c9a96e] font-semibold">
                Suggested amount to overtake: {formatCurrency(suggestedAmount)}
              </p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <ContributeForm 
              user={user}
              userRanking={userRanking}
              userProfile={userProfile}
              suggestedAmount={suggestedAmount}
              onPaymentSuccess={loadUserData}
            />
          </div>
          <div>
            <RankingPreview rankings={topRankings} currentUserId={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContributePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a96e]"></div>
      </div>
    }>
      <ContributePageContent />
    </Suspense>
  )
}
